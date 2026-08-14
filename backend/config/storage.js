const fs = require('fs');
const path = require('path');

const uploadsDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', 'uploads');

const uploadsPublicPath = '/uploads';

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

function getUploadPublicPath(filename) {
  return `${uploadsPublicPath}/${filename}`;
}

function resolveUploadPathFromPublicPath(photoPath) {
  if (!photoPath || !photoPath.startsWith(`${uploadsPublicPath}/`)) {
    return null;
  }

  const filename = path.basename(photoPath);
  return path.join(uploadsDir, filename);
}

module.exports = {
  uploadsDir,
  uploadsPublicPath,
  ensureUploadsDir,
  getUploadPublicPath,
  resolveUploadPathFromPublicPath
};
