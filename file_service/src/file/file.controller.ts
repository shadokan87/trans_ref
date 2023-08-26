import {
  Controller,
  FileTypeValidator,
  Injectable,
  MaxFileSizeValidator,
  Post,
  Req,
  UseInterceptors,
  UploadedFile,
  Logger,
  ParseFilePipe,
  HttpException,
  HttpStatus,
  NestInterceptor,
  CallHandler,
} from "@nestjs/common";

import { ExecutionContext } from "@nestjs/common";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { HttpService } from "src/http/http.service";
import { AxiosError } from "axios";
import { Observable } from "rxjs";
var path = require("path");

interface myConfig {
  avatarStoragePath: string;
  oneKB: number;
  maxSizeMB: number;
}

const config: myConfig = {
  oneKB: 1024,
  maxSizeMB: 6,
  avatarStoragePath: "./src/storage/avatar",
};

const logger = new Logger();

const avatarUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: config.avatarStoragePath,
    filename: (req: any, file: any, cb: any) => {
      const extension: string = path.parse(file.originalname).ext;
      logger.log(`user -- ${JSON.stringify(req["user"])}`);
      cb(null, `${req["user"].id}${extension}`);
    },
  }),
};

@Injectable()
class UserInterceptor implements NestInterceptor {
  constructor(private readonly httpService: HttpService) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const ctx = context.switchToHttp();

    const BearerHeader = ctx.getRequest().headers["authorization"];
    if (BearerHeader) {
      try {
        const user = await this.httpService
          .checkJWT(BearerHeader.split(" ")[1])
          .then((data) => data.data.user);

        ctx.getRequest()["user"] = user;
      } catch (e) {
        if (e instanceof AxiosError && e.code == AxiosError.ERR_BAD_REQUEST)
          throw new HttpException(
            {
              status: HttpStatus.FORBIDDEN,
              error: "Token invalid",
            },
            HttpStatus.FORBIDDEN
          );
        else
          throw new HttpException(
            {
              status: HttpStatus.INTERNAL_SERVER_ERROR,
              error: "Unexpected error",
            },
            HttpStatus.INTERNAL_SERVER_ERROR
          );
      }
    }
    return next.handle();
  }
}

@Controller("avatar")
export class FileController {
  constructor(private readonly httpService: HttpService) {}
  @Post("upload")
  @UseInterceptors(
    UserInterceptor,
    FileInterceptor("file", avatarUploadOptions)
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /.(jpg|jpeg|png|gif)$/ }),
          new MaxFileSizeValidator({
            maxSize: config.maxSizeMB * config.oneKB * config.oneKB,
          }),
        ],
      })
    )
    file: Express.Multer.File,
    @Req() req: Request
  ) {
    return HttpStatus.CREATED;
  }
}
