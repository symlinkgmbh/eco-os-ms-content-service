/**
 * Copyright 2018-2019 Symlink GmbH
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */



import { Request } from "express";
import { injectContentService } from "@symlinkde/eco-os-pk-storage-content";
import { MsContent, PkStorageContent, MsOverride } from "@symlinkde/eco-os-pk-models";
import { CustomRestError, apiResponseCodes } from "@symlinkde/eco-os-pk-api";
import { isArray } from "util";

@injectContentService
export class ContentController {
  public contentService!: PkStorageContent.IContentService;

  public async addContent(req: Request): Promise<void> {
    if (isArray(req.body)) {
      req.body.map(async (entry) => {
        const { checksum, key, liveTime, domain } = entry;
        if (liveTime !== undefined && liveTime !== null) {
          const ttl = new Date(liveTime);
          const resultWithDate = await this.contentService.addContent(<MsContent.IContent>{
            checksum,
            key,
            liveTime: ttl,
            domain,
          });

          if (resultWithDate === null) {
            throw new CustomRestError(
              {
                code: 400,
                message: "Problem in creating content entry with ttl",
              },
              400,
            );
          }

          return;
        }

        const result = await this.contentService.addContent(<MsContent.IContent>{ checksum, key, domain });
        if (result === null) {
          throw new CustomRestError(
            {
              code: 400,
              message: "Problem in creating content entry",
            },
            400,
          );
        }
      });
    } else {
      const { checksum, key, liveTime, domain } = req.body;
      if (liveTime !== undefined && liveTime !== null) {
        const ttl = new Date(liveTime);
        const resultWithDate = await this.contentService.addContent(<MsContent.IContent>{
          checksum,
          key,
          liveTime: ttl,
          domain,
        });

        if (resultWithDate === null) {
          throw new CustomRestError(
            {
              code: 400,
              message: "Problem in creating content entry with ttl",
            },
            400,
          );
        }

        return;
      }

      const result = await this.contentService.addContent(<MsContent.IContent>{ checksum, key, domain });
      if (result === null) {
        throw new CustomRestError(
          {
            code: 400,
            message: "Problem in creating content entry",
          },
          400,
        );
      }
    }
    return;
  }

  public async getContent(req: MsOverride.IRequest): Promise<MsContent.IContent> {
    const checksum = decodeURIComponent(req.params.checksum);
    const result = await this.contentService.getContent(checksum);
    if (result === null) {
      throw new CustomRestError(
        {
          code: apiResponseCodes.C821.code,
          message: apiResponseCodes.C821.message,
        },
        404,
      );
    }

    return result;
  }

  public async revokeOutdatedContent(): Promise<boolean> {
    return await this.contentService.revokeOutdatedContent();
  }
}
