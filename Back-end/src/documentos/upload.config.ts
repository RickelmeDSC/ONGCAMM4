import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

export function multerConfig(tipo: string): MulterOptions {
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dest = `./uploads/${tipo}`;
        mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowed.includes(file.mimetype)) {
        return cb(new BadRequestException('Tipo de arquivo não permitido'), false);
      }
      cb(null, true);
    },
  };
}
