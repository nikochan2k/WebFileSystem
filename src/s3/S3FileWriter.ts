import { AbstractFileWriter } from "../AbstractFileWriter";
import { FileWriter } from "../filewriter";
import { getKey } from "./S3Util";
import { S3FileEntry } from "./S3FileEntry";
import { CompletedMultipartUpload } from "aws-sdk/clients/s3";

export class S3FileWriter extends AbstractFileWriter implements FileWriter {
  constructor(private s3FileEntry: S3FileEntry) {
    super(s3FileEntry);
  }

  get file() {
    return this.s3FileEntry.file_;
  }

  set file(file: File) {
    this.s3FileEntry.file_ = file;
  }

  private handleError(err: Error): boolean {
    if (err) {
      if (this.onerror) {
        const evt: ProgressEvent<EventTarget> = {
          error: err,
          loaded: this.position,
          total: this.length,
          lengthComputable: true
        } as any;
        this.onerror(evt);
      }
      console.error(err);
      return true;
    }
    return false;
  }

  doWrite(data: Blob) {
    const filesystem = this.s3FileEntry.filesystem;
    const s3 = filesystem.s3;
    const bucket = filesystem.bucket;
    const key = getKey(this.s3FileEntry.fullPath);
    s3.createMultipartUpload(
      {
        Bucket: bucket,
        Key: key,
        ContentType: "application/octet-stream"
      },
      async (err, res) => {
        if (this.handleError(err)) {
          return;
        }

        try {
          const uploadId = res.UploadId;
          const partSize = 1024 * 1024 * 5;
          const allSize = this.file.size;

          if (this.onwritestart) {
            this.onwritestart(null); // TODO
          }

          const multipartMap: CompletedMultipartUpload = {
            Parts: []
          };

          for (
            let rangeStart = 0, partNum = 1;
            rangeStart < allSize;
            rangeStart += partSize, partNum++
          ) {
            const end = Math.min(rangeStart + partSize, allSize);

            let body: any;
            if (typeof process === "object") {
              // Node
              const sendData = await new Promise<Uint8Array>(resolve => {
                const fileReader = new FileReader();
                fileReader.onloadend = event => {
                  const data = event.target.result as ArrayBuffer;
                  const byte = new Uint8Array(data);
                  resolve(byte);
                };
                const blob = this.file.slice(rangeStart, end);
                fileReader.readAsArrayBuffer(blob);
              });
              body = new Buffer(sendData);
            } else {
              // Browser
              body = this.file.slice(rangeStart, end);
            }
            const partUpload = await s3
              .uploadPart({
                Bucket: bucket,
                Key: key,
                Body: body,
                PartNumber: partNum,
                UploadId: uploadId
              })
              .promise();

            multipartMap.Parts.push({
              ETag: partUpload.ETag,
              PartNumber: partNum
            });
          }

          const doneParams = {
            Bucket: filesystem.bucket,
            Key: key,
            MultipartUpload: multipartMap,
            UploadId: uploadId
          };

          await s3.completeMultipartUpload(doneParams).promise();

          this.position += data.size;
          if (this.onwriteend) {
            const evt: ProgressEvent<EventTarget> = {
              loaded: this.position,
              total: this.length,
              lengthComputable: true
            } as any;
            this.onwriteend(evt);
          }
        } catch (e) {
          this.handleError(e);
        }
      }
    );
  }
}
