const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const path = require('path');

const server = http.createServer((req, res) => {
    fs.readFile(path.join(__dirname, 'index.html'), 'utf-8', (error, content) => {
        if (error) {
            console.log('Error: ', error);
            response.writeHead(404);
            response.end('Error: ' + error);
        } else {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(content, 'utf-8');
        }
    });

    if (req.method === 'POST' && req.url === "/upload") {
        let body = '';

        req.on('data', (data) => {
            body += data;
        });
        req.on('end', () => {
            const content = Buffer.from(body, 'binary');
            const fileName = `uploads/image_${Date.now()}.txt`;

            fs.writeFile(fileName, content, (err) => {
                if (err) {
                    throw err;
                }
                res.end('File uploaded and saved');
            });
        });
    }

    if (req.method === 'GET' && req.url === '/images') {
        fs.readdir('uploads', (err, files) => {
            if (err) {
                throw err;
            }

            const fileNames = files.filter((file) => file.endsWith('.txt'));
            const fileContents = fileNames.map((fileName) => {
                return {
                    fileName: fileName,
                    content: fs.readFileSync(`uploads/${fileName}`, 'utf8')
                };
            });

            res.end(JSON.stringify(fileContents));
        });
    }

    if (req.method === "POST" && req.url === "/clearImages") {
        try {
            const files = fs.readdirSync("./uploads");

            files.forEach(file => {
                fs.unlinkSync(`./uploads/${file}`);
            });

            res.writeHead(200, {"Content-Type": "text/plain"});
            res.end("Images successfully cleared and folder deleted");
        } catch (error) {
            console.error("Error clearing images:", error);
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.end("Error clearing images");
        }
    }
}).listen(2000, () => {
    console.log('Server is running on port 2000');
});

const wss = new WebSocket.Server({ server});
const watcher = chokidar.watch('uploads');

wss.on('connection', function(ws) {
    const sendFiles = () => {
        fs.readdir('uploads', (err, files) => {
            if (err) {
                console.error(err);
            } else {
                const fileNames = files.filter((file) => file.endsWith('.txt'));
                const fileContents = fileNames.map((fileName) => {
                    return fs.readFileSync(`uploads/${fileName}`, 'utf8');
                });
                const jsonData = JSON.stringify(fileContents);

                ws.send(jsonData);
            }
        });
    };

    sendFiles();

    watcher.on('change', function(path) {
        console.log(`File ${path} has been changed. Sending update to clients.`);
        sendFiles();
    });

    watcher.on('unlink', function(path) {
        console.log(`File ${path} has been deleted. Sending update to clients.`);
        sendFiles();
    });
});
