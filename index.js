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

                let user = '';
                let date = '';
                let comment = text;
                let dateObj = null;

                const parts = text.split(';');
                if (parts.length === 3) {
                    user = parts[0].trim();
                    date = parts[1].trim();
                    comment = parts[2].trim();
                    dateObj = parseDate(date);
                }

                todos.push({ text: comment, importance, user, date, dateObj });
            }
        }
    }
    return todos;
}

function parseDate(dateString) {
    if (!dateString) return null;

    const parts = dateString.split('-');
    if (parts.length > 3) return null;

    let year = parseInt(parts[0], 10);
    let month = parts.length >= 2 ? parseInt(parts[1], 10) - 1 : 0;
    let day = parts.length === 3 ? parseInt(parts[2], 10) : 1;

    if (isNaN(year) || year < 1000) return null;
    if (month < 0 || month > 11) return null;
    if (day < 1 || day > 31) return null;

    return new Date(year, month, day);
}

function printTable(todos) {
    if (todos.length === 0) {
        console.log('Нет TODO для отображения.');
        return;
    }

    const maxWidths = [1, 10, 10, 50]; // Ограничения ширины колонок
    const headers = ['!', 'User', 'Date', 'Comment'];

    function formatCell(text, width) {
        if (text.length > width) return text.slice(0, width - 3) + '...';
        return text.padEnd(width, ' ');
    }

    const formattedRows = todos.map(todo => [
        todo.importance > 0 ? '!' : '',
        formatCell(todo.user, maxWidths[1]),
        formatCell(todo.date, maxWidths[2]),
        formatCell(todo.text, maxWidths[3])
    ]);

    const headerRow = headers.map((h, i) => formatCell(h, maxWidths[i])).join(' | ');
    const separator = maxWidths.map(w => '-'.repeat(w)).join('-|-');

    console.log(headerRow);
    console.log(separator);
    formattedRows.forEach(row => console.log(row.join(' | ')));
    console.log(separator);
}

function processCommand(command) {
    const [cmd, ...args] = command.split(' ');

    switch (cmd) {
        case 'exit':
            process.exit(0);
            break;

        case 'show':
            printTable(extractTodosFromFiles());
            break;

        case 'important':
            printTable(extractTodosFromFiles().filter(todo => todo.importance > 0));
            break;

        case 'user':
            if (args.length === 0) {
                console.log('Укажите имя пользователя: например, "user Veronika"');
                break;
            }
            const userName = args.join(' ').toLowerCase();
            printTable(extractTodosFromFiles().filter(todo => todo.user.toLowerCase() === userName));
            break;

        case 'sort':
            if (args.length === 0) {
                console.log('Укажите тип сортировки: importance, user или date');
                break;
            }
            const sortType = args[0];
            let sortedTodos = extractTodosFromFiles();


            if (sortType === 'importance') {
                sortedTodos.sort((a, b) => b.importance - a.importance);
            } else if (sortType === 'user') {
                sortedTodos.sort((a, b) => {
                    const userA = a.user.toLowerCase();
                    const userB = b.user.toLowerCase();
                    if (!userA && !userB) return 0;
                    if (!userA) return 1;
                    if (!userB) return -1;
                    return userA.localeCompare(userB);
                });
            } else if (sortType === 'date') {
                sortedTodos.sort((a, b) => {
                    if (!a.dateObj && !b.dateObj) return 0;
                    if (!a.dateObj) return 1;
                    if (!b.dateObj) return -1;
                    return b.dateObj - a.dateObj;
                });
            } else {
                console.log('Неверный тип сортировки. Используйте: importance, user или date');
                break;
            }

            printTable(sortedTodos);
            break;

        case 'date':
            if (args.length === 0) {
                console.log('Укажите дату в формате yyyy или yyyy-mm или yyyy-mm-dd');
                break;
            }
            const filterDate = parseDate(args[0]);
            if (!filterDate) {
                console.log('Некорректный формат даты. Пример: 2018, 2018-03, 2018-03-02');
                break;
            }

            printTable(
                extractTodosFromFiles().filter(todo => todo.dateObj && todo.dateObj > filterDate)
            );
            break;

        default:
            console.log('wrong command');
            break;
    }
}
