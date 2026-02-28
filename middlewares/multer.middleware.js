import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads');
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${file.fieldname}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if(!allowed.includes(file.mimetype)){
        return cb(new Error('Only JPG and PNG images are allowed'), false);
    }
    cb(null, true);
};

const upload = multer({storage, fileFilter, limits: {fileSize: 2*1024*1024}});

export const uploadUserProfile = upload.single("profile");
export const uploadProductImage = upload.single("image");