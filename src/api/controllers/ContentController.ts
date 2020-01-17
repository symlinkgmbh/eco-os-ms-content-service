/**
 * Copyright 2018-2020 Symlink GmbH
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
import { MsContent, PkStorageContent, MsOverride, PkCore } from "@symlinkde/eco-os-pk-models";
import { CustomRestError, apiResponseCodes } from "@symlinkde/eco-os-pk-api";
import { isArray } from "util";
import { injectFederationClient } from "@symlinkde/eco-os-pk-core";

@injectFederationClient
@injectContentService
export class ContentController {
  private contentService!: PkStorageContent.IContentService;
  private federationClient!: PkCore.IEcoFederationClient;

  public async addContent(req: Request): Promise<void> {
    if (isArray(req.body)) {
      req.body.map(async (entry) => {
        const { checksum, key, liveTime, domain, maxOpen } = entry;
        if (liveTime !== undefined && liveTime !== null) {
          const ttl = new Date(liveTime);
          const resultWithDate = await this.contentService.addContent(<MsContent.IContent>{
            checksum,
            key,
            liveTime: ttl,
            domain,
            maxOpen,
          });

          if (resultWithDate === null) {
            throw new CustomRestError(
              {
                code: apiResponseCodes.C850.code,
                message: apiResponseCodes.C850.message,
              },
              400,
            );
          }

          return;
        }

        const result = await this.contentService.addContent(<MsContent.IContent>{ checksum, key, domain, maxOpen });
        if (result === null) {
          throw new CustomRestError(
            {
              code: apiResponseCodes.C851.code,
              message: apiResponseCodes.C851.message,
            },
            400,
          );
        }
      });
    } else {
      const { checksum, key, liveTime, domain, maxOpen } = req.body;
      if (liveTime !== undefined && liveTime !== null) {
        const ttl = new Date(liveTime);
        const resultWithDate = await this.contentService.addContent(<MsContent.IContent>{
          checksum,
          key,
          liveTime: ttl,
          domain,
          maxOpen,
        });

        if (resultWithDate === null) {
          throw new CustomRestError(
            {
              code: apiResponseCodes.C850.code,
              message: apiResponseCodes.C850.message,
            },
            400,
          );
        }

        return;
      }

      const result = await this.contentService.addContent(<MsContent.IContent>{ checksum, key, domain, maxOpen });
      if (result === null) {
        throw new CustomRestError(
          {
            code: apiResponseCodes.C851.code,
            message: apiResponseCodes.C851.message,
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
    return this.processLoadedContent(result);
  }

  public async processContentRequestFromFederation(req: MsOverride.IRequest): Promise<MsContent.IContent> {
    const checksum = decodeURIComponent(req.params.checksum);
    try {
      const result = await this.contentService.getContent(checksum);
      return this.processFederationContent(result);
    } catch (err) {
      throw new CustomRestError(
        {
          code: 404,
          message: "er",
        },
        404,
      );
    }
  }

  public async revokeOutdatedContent(): Promise<boolean> {
    return await this.contentService.revokeOutdatedContent();
  }

  private async processLoadedContent(content: MsContent.IContent | null): Promise<MsContent.IContent> {
    if (content === null) {
      throw new CustomRestError(
        {
          code: apiResponseCodes.C821.code,
          message: apiResponseCodes.C821.message,
        },
        404,
      );
    }

    if ((content.key === null || content.key.trim().length < 1) && content.domain !== undefined) {
      const resultFromFederation = await this.federationClient.getRemoteContent(content.checksum, content.domain);
      return resultFromFederation.data.data;
    }

    return content;
  }

  private processFederationContent(content: MsContent.IContent | null): MsContent.IContent {
    if (content === null) {
      throw new CustomRestError(
        {
          code: apiResponseCodes.C821.code,
          message: apiResponseCodes.C821.message,
        },
        404,
      );
    }

    return content;
  }
}
