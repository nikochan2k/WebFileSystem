import {
  DirectoryEntryAsync,
  EntryAsync,
  FileSystemAsync,
  FileEntryAsync
} from "./filesystem";

export class Synchronizer {
  constructor(
    public local: FileSystemAsync,
    public remote: FileSystemAsync,
    public mirror = false
  ) {
    if (!local.isLocal) {
      throw new Error("local filesystem is not local");
    }
  }

  async transfer(local: FileEntryAsync, remote: FileEntryAsync) {
    const file = await local.file();
    const writer = await remote.createWriter();
    await writer.write(file);
    const remoteMetadata = await remote.getMetadata();
    await local.setMetadata(remoteMetadata);
  }

  async synchronizeEntries(
    localEntries: EntryAsync[],
    remoteEntries: EntryAsync[]
  ) {
    const newLocalEntries: EntryAsync[] = [];
    outer: do {
      while (0 < localEntries.length) {
        const localEntry = localEntries.shift();
        for (let i = 0, end = remoteEntries.length; i < end; i++) {
          const remoteEntry = remoteEntries[i];
          if (localEntry.name === remoteEntry.name) {
            if (
              localEntry.isFile !== remoteEntry.isFile ||
              localEntry.isDirectory !== remoteEntry.isDirectory
            ) {
              // prioritize source entry
              if (remoteEntry.isFile) {
                await remoteEntry.remove();
              } else {
                await (remoteEntry as DirectoryEntryAsync).removeRecursively();
              }
              remoteEntries.splice(i);
              continue outer;
            }

            if (localEntry.isFile) {
              const localMeta = await localEntry.getMetadata();
              const localLastModified = localMeta.modificationTime.getTime();
              const remoteMeta = await remoteEntry.getMetadata();
              const remoteLastModified = remoteMeta.modificationTime.getTime();
              if (localLastModified === remoteLastModified) {
                if (localMeta.size !== remoteMeta.size) {
                  await this.transfer(
                    localEntry as FileEntryAsync,
                    remoteEntry as FileEntryAsync
                  );
                }
              } else {
                if (remoteLastModified < localLastModified) {
                  await this.transfer(
                    localEntry as FileEntryAsync,
                    remoteEntry as FileEntryAsync
                  );
                } else {
                  if (this.mirror) {
                    await this.transfer(
                      remoteEntry as FileEntryAsync,
                      localEntry as FileEntryAsync
                    );
                  }
                }
              }
            } else {
              await this.synchronizeDirectory(
                localEntry as DirectoryEntryAsync,
                remoteEntry as DirectoryEntryAsync
              );
            }
            remoteEntries.splice(i);
            continue outer;
          }
        }
        newLocalEntries.push(localEntry);
      }
    } while (false);

    for (const localEntry of newLocalEntries) {
      if (localEntry.isFile) {
        const remoteEntry = await this.remote.root.getFile(
          localEntry.fullPath,
          {
            create: true
          }
        );
        await this.transfer(
          localEntry as FileEntryAsync,
          remoteEntry as FileEntryAsync
        );
      } else {
        const remoteEntry = await this.remote.root.getDirectory(
          localEntry.fullPath,
          {
            create: true
          }
        );
        await this.synchronizeDirectory(
          localEntry as DirectoryEntryAsync,
          remoteEntry as DirectoryEntryAsync
        );
      }
    }

    if (!this.mirror) {
      return;
    }

    for (const remoteEntry of remoteEntries) {
      if (remoteEntry.isFile) {
        const localEntry = await this.local.root.getFile(remoteEntry.fullPath, {
          create: true
        });
        await this.transfer(
          remoteEntry as FileEntryAsync,
          localEntry as FileEntryAsync
        );
      } else {
        const localEntry = await this.local.root.getDirectory(
          remoteEntry.fullPath,
          {
            create: true
          }
        );
        await this.synchronizeDirectory(
          remoteEntry as DirectoryEntryAsync,
          localEntry as DirectoryEntryAsync
        );
      }
    }
  }

  async synchronizeDirectory(
    localDir: DirectoryEntryAsync,
    remoteDir: DirectoryEntryAsync
  ) {
    const localReader = localDir.createReader();
    const localEntries = await localReader.readEntries();
    const remoteReader = remoteDir.createReader();
    const remoteEntries = await remoteReader.readEntries();
    this.synchronizeEntries(localEntries, remoteEntries);
  }

  async synchronizeAll() {
    this.synchronizeDirectory(this.local.root, this.remote.root);
  }
}
