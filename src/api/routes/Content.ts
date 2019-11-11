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



import { AbstractRoutes, injectValidatorService } from "@symlinkde/eco-os-pk-api";
import { PkApi } from "@symlinkde/eco-os-pk-models";
import { Application, Request, Response, NextFunction } from "express";
import { ContentController } from "../controllers/ContentController";
import { isArray } from "util";

@injectValidatorService
export class ContentRoute extends AbstractRoutes implements PkApi.IRoute {
  private contentController: ContentController;
  private validatorService!: PkApi.IValidator;
  private postContentPattern: PkApi.IValidatorPattern = {
    checksum: "",
    key: "",
  };

  private postContentFederationPattern: PkApi.IValidatorPattern = {
    checksum: "",
  };

  constructor(app: Application) {
    super(app);
    this.contentController = new ContentController();
    this.activate();
  }

  public activate(): void {
    this.addContent();
    this.addContentFromFederation();
    this.getContent();
    this.getContentFromFederation();
    this.revokeOutdatedContent();
  }

  private addContent(): void {
    this.getApp()
      .route("/content")
      .post((req: Request, res: Response, next: NextFunction) => {
        if (!isArray(req.body)) {
          this.validatorService.validate(req.body, this.postContentPattern);
        } else {
          const contentArr = req.body;
          contentArr.map((entry) => {
            this.validatorService.validate(entry, this.postContentPattern);
          });
        }
        this.contentController
          .addContent(req)
          .then(() => {
            res.sendStatus(200);
          })
          .catch((err) => {
            next(err);
          });
      });
  }

  private addContentFromFederation(): void {
    this.getApp()
      .route("/content/federation")
      .post((req: Request, res: Response, next: NextFunction) => {
        if (!isArray(req.body)) {
          this.validatorService.validate(req.body, this.postContentFederationPattern);
        } else {
          const contentArr = req.body;
          contentArr.map((entry) => {
            this.validatorService.validate(entry, this.postContentFederationPattern);
          });
        }
        this.contentController
          .addContent(req)
          .then(() => {
            res.sendStatus(200);
          })
          .catch((err) => {
            next(err);
          });
      });
  }

  private getContent(): void {
    this.getApp()
      .route("/content/:checksum")
      .get((req: Request, res: Response, next: NextFunction) => {
        this.contentController
          .getContent(req)
          .then((result) => {
            res.send(result);
          })
          .catch((err) => {
            next(err);
          });
      });
  }

  private getContentFromFederation(): void {
    this.getApp()
      .route("/content/federation/:checksum")
      .get((req: Request, res: Response, next: NextFunction) => {
        this.contentController
          .processContentRequestFromFederation(req)
          .then((result) => {
            res.send(result);
          })
          .catch((err) => {
            next(err);
          });
      });
  }

  private revokeOutdatedContent(): void {
    this.getApp()
      .route("/content")
      .delete((req: Request, res: Response, next: NextFunction) => {
        this.contentController
          .revokeOutdatedContent()
          .then((result) => {
            res.send({
              foundOutdatedContentAndRevoke: result,
            });
          })
          .catch((err) => {
            next(err);
          });
      });
  }
}
