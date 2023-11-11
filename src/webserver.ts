// Require express and body-parser
import express from "express";
import multer from 'multer';
import {handleUploaded} from "./themeStore/handleUploaded";
import {cacheFolder} from "./globals/constants";
import {
    deleteThemeWithID,
    getAllThemes,
    getThemeFromID, getThemesFromName, getThemeStatus,
    SavableMetadata,
    updateThemeWithID
} from "./themeStore/databaseHandler/databaseHandler";
import ws from "ws";
import cors from "cors";
import rateLimit from "express-rate-limit";
import {getDownloadURL, getPreviewURLsFromS3} from "./S3Buckets/getDownloadableURL";
import {streamS3ObjectToResponse} from "./S3Buckets/getFileStream";
import path from "path";
import {generateTimeBasedUUID, getUserEligibility} from "./globals/security";

//minimal express server
const app = express();
const PORT = 3000;
export const wsServer = new ws.Server({noServer: true});

//start the express server on port 3000
export function expressServer(secret: string) {

    // limit each IP to 100 requests per windowMs
    const limiter = rateLimit({
        windowMs: 1000, // 1 second
        limit: 10
    });

    app.use(limiter)
    app.set('trust proxy', 1)
    app.use(express.json());
    app.use(cors());
    app.listen(PORT, () => console.log(`Now listening on port ${PORT} 🚀`));

    // setting up disk storage
    const storage = multer.diskStorage({
        destination: (req: any, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) => {
            callback(null, cacheFolder)
        },
        filename: (req: any, file: Express.Multer.File, callback: (error: Error | null , destination: string) => void) => {
            const ext = path.extname(file.originalname);
            const filePath = `${generateTimeBasedUUID()}${ext}`;
            callback(null, filePath);
        }
    })

    const upload = multer({ storage: storage });

    //----------- Websocket -----------
    // Set up a headless websocket server
    // wsServer.on("connection", (socket: any) => {
    //     socket.on("message", function message(data: any, isBinary: any) {
    //         let msg = isBinary ? data : data.toString();
    //         try {
    //             msg = JSON.parse(msg);
    //         } catch (error) {
    //             msg = msg;
    //         }
    //         // websocketMessageHandler(msg, socket);
    //     });
    // });
    //
    // // on close function -- it just prints the reason
    // wsServer.on("close", function close(code: any, data: any) {
    //     const reason = data.toString();
    //     console.log(`Disconnected with code ${code} and reason ${reason}`);
    //     // Continue as before.
    // });
    //
    // // this handles the initial handshake and upgrade from HTTP to WS
    // server.on("upgrade", (request: any, socket: any, head: any) => {
    //     wsServer.handleUpgrade(request, socket, head, (socket: any) => {
    //         wsServer.emit("connection", socket, request);
    //     });
    // });

    //----------- HTTP Request Handler -----------

    // this handles the cors preflight request
    app.options("*", cors());

    app.get("/eligibility/:token", async (req: any, res: any) => {
        //get the campaign channel form my server
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            //Handle got message
            const id = req.params.token
            const eligibility = await getUserEligibility(id)
            res.status(200).json(eligibility);

        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403);
        }
    });
    //Handle File Uploads
    app.post('/themes/upload', upload.single('file'), (req: any, res: any) => {
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            if (!req.file) {
                return res.status(400).json({message: 'No file uploaded'});
            }

            const extension = path.extname(req.file.originalname);
            if (extension !== '.zip') {
                return res.status(400).json({message: 'Only .zip files are allowed'});
            }

            handleUploaded(req.file.filename).then(() => {
                res.status(200).json({message: 'File uploaded successfully'});
            });
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403);
        }
    });

    app.get("/themes", async (req: any, res: any) => {
        //get the campaign channel form my server
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            //Handle got message
            //Handle got message
            // Define default fetch limit and offset
            let fetchLimit = req.query.fetchLimit || 100;
            let offset = req.query.offset || 0;

            let themes = await getAllThemes(fetchLimit, offset)
            res.status(200).json(themes);
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403);
        }
    });

    app.get("/themes/:themeID", async (req: any, res: any) => {
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            //Handle got message
            let id = req.params.themeID
            let theme = await getThemeFromID(id)
            res.status(200).json(theme);
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403);
        }
    });

    app.get("/themes/name/:name", async (req: any, res: any) => {
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            //Handle got message
            let name = req.params.name
            let theme = await getThemesFromName(name)
            res.status(200).json(theme);
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403);
        }
    });

    app.get("/themes/status/:themeID", async (req: any, res: any) => {
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            let id = req.params.themeID;
            let status = await getThemeStatus(id);

            if (status) {
                res.status(200).json({ status: status });
            } else {
                res.status(404).json({ error: "Theme not found" });
            }
        } else {
            console.error("Error: Bearer Token mismatch");
            res.status(403).json({ error: "Forbidden" });
        }
    });


    app.delete("/themes/:themeID", async (req: any, res: any) => {
        //get the campaign channel form my server
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            //Handle got message
            let id = req.params.themeID
            let deleted = await deleteThemeWithID(id)
            if(deleted) {
                res.sendStatus(200)
            } else {
                res.sendStatus(500)
            }
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403);
        }
    });

    app.put("/themes/:themeID", async (req: any, res: any) => {
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            //Handle got message
            let id = req.params.themeID;
            // Include the update data in req.body
            let updateData = req.body as Partial<SavableMetadata>;

            let updated = await updateThemeWithID(id, updateData);

            if(updated) {
                res.sendStatus(200); // OK
            } else {
                res.sendStatus(500); // Internal Server Error
            }
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403); // Forbidden
        }
    });

    app.get("/themes/redirect/:themeID", async (req: express.Request, res: express.Response) => {
        let id = req.params.themeID;
        let url = await getDownloadURL(id)
        res.redirect(url);
    });

    app.get("/themes/attachment/:themeID", async (req: any, res: any) => {
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            let id = req.params.themeID;
            const key = `themes/${id}`; // if zip files are named by id you can construct key like this
            try {
                await streamS3ObjectToResponse(key, res);
            } catch (e) {
                console.error("Error streaming the file from S3.", e);
                res.sendStatus(500);
            }
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403);
        }
    });

    app.get("/themes/previews/:themeID", async (req: any, res: any) => {
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
           let id = req.params.themeID;
           const previews = await getPreviewURLsFromS3(id)
           res.status(200).json({previews: previews});
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403);
        }
    });

    app.get("/ping", async  (req: any, res: any) => {
        res.sendStatus(200)
    })
}

