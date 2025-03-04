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
                const text = match[1].trim();
                const importance = (text.match(/!/g) || []).length;

                // Парсим user, date и comment (если есть)
                let user = '';
                let date = '';
                let comment = text;

                const parts = text.split(';');
                if (parts.length === 3) {
                    user = parts[0].trim();
                    date = parts[1].trim();
                    comment = parts[2].trim();
                }

                todos.push({ text: comment, importance, user, date });
            }
        }
    }
    return todos;
}

function processCommand(command) {
    const [cmd, ...args] = command.split(' ');

    switch (cmd) {
        case 'exit':
            process.exit(0);
            break;

        case 'show':
            extractTodosFromFiles().forEach(todo => console.log(todo.text));
            break;

        case 'important':
            extractTodosFromFiles()
                .filter(todo => todo.importance > 0)
                .forEach(todo => console.log(todo.text));
            break;

        case 'user':
            if (args.length === 0) {
                console.log('Укажите имя пользователя: например, "user Veronika"');
                break;
            }
            const userName = args.join(' ').toLowerCase();
            extractTodosFromFiles()
                .filter(todo => todo.user.toLowerCase() === userName)
                .forEach(todo => console.log(todo.text));
            break;

        default:
            console.log('wrong command');
            break;
    }
}
