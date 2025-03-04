const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');

console.log('Please, write your command!');
readLine(processCommand);

function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(filePath => ({
        filePath,
        content: readFile(filePath),
    }));
}

function extractTodosFromFiles() {
    const files = getFiles();
    const todoRegex = /\/\/\s*TODO\s*(.*)/i;

    let todos = [];
    for (const { filePath, content } of files) {
        const lines = content.split('\n');
        for (const line of lines) {
            const match = line.match(todoRegex);
            if (match) {
                todos.push(match[1].trim());
            }
        }
    }
    return todos;
}

function processCommand(command) {
    switch (command) {
        case 'exit':
            process.exit(0);
            break;

        case 'show':
            const todos = extractTodosFromFiles();
            todos.forEach(todo => console.log(todo));
            break;

        default:
            console.log('wrong command');
            break;
    }
}
