const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const path = require('path');

const server = http.createServer((req, res) => {
    setAccessHeaders(res);
    handleFileRequest(req, res);

    if (req.method === 'POST' && req.url === "/upload") {
        uploadImage(req, res);
    }

    if (req.method === 'GET' && req.url === '/images') {
        getImages(req, res);
    }

    if (req.method === "POST" && req.url === "/clearImages") {
        clearImages(req, res);
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

const getImages = (req, res) => {
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

const uploadImage = (req, res) => {
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

const clearImages = (req, res) => {
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

const handleFileRequest = (req, res) => {
    var filePath = './' + (req.url === '/' ? 'index.html' : req.url);
    var extname = path.extname(filePath);
    var contentType;

    if (extname) {
        switch (extname) {
            case '.html':
                contentType = 'text/html';
                break;
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.jpg':
                contentType = 'image/jpeg';
                break;
            case '.jpeg':
                contentType = 'image/jpeg';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            default:
                contentType = 'application/json';
        }

        console.log(req.method, req.url, extname, filePath, contentType)

        fs.readFile(filePath, function (error, content) {
            console.log('error', error)
            if (error) {
                res.writeHead(error.code == 'ENOENT' ? 404 : 500);
                res.end(error.code == 'ENOENT' ? 'Error 404: File not found' : 'Error 500: Server Error', 'utf-8');
            } else {
                res.writeHead(200, {'Content-Type': contentType});
                res.end(content, 'utf-8');
            }
        });
    }
}

const setAccessHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
}