const fs = require('fs');

fs.readFile('input.ef', 'utf8', (err, data) => {
    if (err) {
        console.error("Erro ao ler o arquivo:", err)
        return
    }


    function lexer(input) {
        const tokens = []
        let i = 0
        while (i < input.length) {
            const char = input[i]

            if (/\s/.test(char)) {
                i++;
                continue;
            }

            if (/[a-zA-Z_]/.test(char)) {
                let identifier = ''
                while (/[a-zA-Z_]/.test(input[i])) identifier += input[i++];
                switch (identifier) {
                    case "type":
                    case "var":
                        tokens.push({ type: 'KEYWORD', value: identifier });
                        break;
                    default:
                        tokens.push({ type: 'IDENTIFIER', value: identifier });
                }
                continue;
            }

            if (/[0-9]/.test(char)) {
                let number = '';
                while (/[0-9]/.test(input[i])) number += input[i++];
                tokens.push({ type: 'NUMBER', value: parseInt(number, 10) });
                continue;
            }

            if (char === '=') {
                tokens.push({ type: 'OPERATOR', value: char });
                i++;
                continue;
            }

            switch (char) {
                case "+":
                    tokens.push({ type: 'OPERATOR', value: char });
                    i++;
                    continue;
            }

            if (char === ';') {
                tokens.push({ type: 'DELIMITER', value: char });
                i++;
                continue;
            }

            throw new Error(`Caractere desconhecido: ${char}`);
        }
        return tokens;
    }

    // Função parser para criar AST
    function parser(tk) {
        const ast = { type: "Program", body: [] };
        let i = 0;

        while (i < tk.length) {
            switch (tk[i].type) {
                case "KEYWORD":
                    switch (tk[i].value) {
                        case "var":
                            let variableDeclaration = {
                                type: "variableDeclaration",
                                name: tk[i + 1].value,
                                init: {
                                    type: "",
                                    value: "",
                                }
                            };
                            let il = i + 1
                            let esquerda = {}
                            while (tk[il].type != "DELIMITER") {
                                switch (tk[il].type) {
                                    case "NUMBER":
                                        if (tk[il + 1].value === "+") {
                                            esquerda = { type: 'literal', value: tk[il].value }
                                        } else if (tk[il - 1].value === "+") {
                                            variableDeclaration.init.right = { type: 'literal', value: tk[il].value };
                                        } else {
                                            variableDeclaration.init = { type: 'literal', value: tk[il].value };
                                        }
                                        break
                                    case "IDENTIFIER":
                                        if (tk[il + 1].value === "+") {
                                            esquerda = { type: 'identifier', name: tk[il].value }
                                        } else if (tk[il - 1].value === "+") {
                                            variableDeclaration.init.right = { type: 'identifier', name: tk[il].value };
                                        } else {
                                            variableDeclaration.init = { type: 'identifier', name: tk[il].value };
                                        }
                                        break;
                                    case "OPERATOR":
                                        if (tk[il].value === "+") {

                                            variableDeclaration.init = {
                                                type: 'binaryExpression',
                                                operator: tk[il].value,
                                                left: esquerda,
                                                right: {}
                                            };
                                        }
                                        break
                                    default:
                                        throw new Error(`Tipo de inicialização desconhecido: ${tk[il].type}`);

                                }
                                il++

                            }
                            ast.body.push(variableDeclaration);
                            i = il + 1; // var name = value ;
                            break;
                        case "type":
                            let typeStatement = {
                                type: "typeStatement",
                                argument: { type: "" }
                            };
                            if (tk[i + 1]) {
                                switch (tk[i + 1].type) {
                                    case "NUMBER":
                                        typeStatement.argument = { type: 'literal', value: tk[i + 1].value };
                                        break;
                                    case "IDENTIFIER":
                                        typeStatement.argument = { type: 'identifier', name: tk[i + 1].value };
                                        break;
                                    default:
                                        throw new Error(`Tipo de argumento desconhecido: ${tk[i + 1].type}`);
                                }
                                ast.body.push(typeStatement);
                                i += 3; // type argument ;
                            } else {
                                throw new Error("Sintaxe inválida para type statement.");
                            }
                            break;
                        default:
                            throw new Error(`Palavra-chave desconhecida: ${tk[i].value}`);
                    }
                    break;
                case "DELIMITER":
                    i += 1;
                    break;
                case "NUMBER":
                    i += 1;
                    break;
                case "OPERATOR":
                    i += 1;
                    break;
                default:
                    throw new Error(`Tipo de token inesperado: ${tk[i].type}`);
            }
        }

        return ast;
    }

    // Função interpret para executar a AST
    function interpret(ast) {
        const environment = {};


        ast.forEach(node => {
            switch (node.type) {
                case 'variableDeclaration':
                    if (node.init.type === 'literal') {
                        let nameVar = node.name;
                        let valueVar = node.init.value;
                        environment[nameVar] = valueVar;
                    } else if (node.init.type === 'identifier') {
                        let nameVar = node.name;
                        let refVarName = node.init.name;
                        if (environment.hasOwnProperty(refVarName)) {
                            let valueVar = environment[refVarName];
                            environment[nameVar] = valueVar;
                        } else {
                            throw new Error(`Erro: A variável '${refVarName}' não está definida.`);
                        }
                    }
                    break;
                case 'typeStatement':
                    if (node.argument.type === 'literal') {
                        console.log(node.argument.value)
                    } else if (node.argument.type === 'identifier') {
                        if (environment.hasOwnProperty(node.argument.name)) {
                            console.log(environment[node.argument.name])
                        } else {
                            throw new Error(`Erro: A variável '${node.argument.name}' não está definida.`);
                        }
                    }
                    break;
                default:
                    throw new Error(`Tipo de nó desconhecido: ${node.type}`);
            }
        });

        return environment;
    }

    const tk = lexer(data)
    console.log(tk)
    const ast = parser(tk)
    console.log(JSON.stringify(ast, null, 2));
    const environment = interpret(ast.body)
    console.log(environment)
});

