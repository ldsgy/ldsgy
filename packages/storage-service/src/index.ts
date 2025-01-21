import * as Credential from "@alicloud/credentials";
import { Service, SettingsSchema } from "@ldsg/core";
import { ModifyGraphQLSchema } from "@ldsg/services";
import OSS from "ali-oss";
import {
  ObjectTypeComposerFieldConfigMapDefinition,
  ResolverRpCb,
} from "graphql-compose";
import jwt from "jsonwebtoken";
import { v4 as uuidV4 } from "uuid";
import { STORAGE_SERVICE_DEFAULT_SETTINGS_SCHEMA } from "./constants";

export * from "./constants";

interface AlibabaCloudOssInfo {
  region: string;
  bucket: string;
  prefix: string;
  credentialsUri: string;
}

/**
 * 存储服务
 */
export class StorageService extends Service {
  settingsSchema: SettingsSchema = STORAGE_SERVICE_DEFAULT_SETTINGS_SCHEMA;

  getInfo = (): AlibabaCloudOssInfo => {
    const settings = this.getSettings();

    const { uri: credentialsUri } = settings;

    const url = new URL(credentialsUri);

    const token = url.searchParams.get("token");

    if (!token) {
      throw new Error("invalid token");
    }

    const decodeRes = jwt.decode(token);

    const { region, bucket, prefix } = decodeRes as jwt.JwtPayload;

    const res: AlibabaCloudOssInfo = {
      region,
      bucket,
      prefix,
      credentialsUri,
    };

    return res;
  };

  getClient = async () => {
    const info = this.getInfo();

    const { bucket, credentialsUri } = info;

    const credentialsConfig = new Credential.Config({
      type: "credentials_uri",
      credentialsURI: credentialsUri,
    });

    const credentialClient = new Credential.default(credentialsConfig);

    const credential = await credentialClient.getCredential();

    const { accessKeyId, accessKeySecret, securityToken } = credential;

    if (!accessKeyId || !accessKeySecret || !securityToken) {
      throw new Error("invalid credential");
    }

    const options: OSS.Options = {
      /** access secret you create */
      accessKeyId,
      /** access secret you create */
      accessKeySecret,
      /** used by temporary authorization */
      stsToken: securityToken,
      /** the default bucket you want to access If you don't have any bucket, please use putBucket() create one first. */
      bucket,
      /** oss region domain. It takes priority over region. */
      endpoint: "ali-oss.storage.ldsgy.com",
      /** the bucket data region location, please see Data Regions, default is oss-cn-hangzhou. */
      region: "oss-cn-hangzhou",
      /** access OSS with aliyun internal network or not, default is false. If your servers are running on aliyun too, you can set true to save lot of money. */
      internal: false,
      /** instruct OSS client to use HTTPS (secure: true) or HTTP (secure: false) protocol. */
      secure: true,
      /** instance level timeout for all operations, default is 60s */
      // timeout?: string | number | undefined;
      /** use custom domain name */
      cname: true,
      /** use time (ms) of refresh STSToken interval it should be less than sts info expire interval, default is 300000ms(5min) when sts info expires. */
      // refreshSTSTokenInterval?: number;
      refreshSTSToken: async () => {
        const { accessKeyId, accessKeySecret, securityToken } =
          await credentialClient.getCredential();

        if (!accessKeyId || !accessKeySecret || !securityToken) {
          throw new Error("invalid credential");
        }

        return {
          accessKeyId: accessKeyId,
          accessKeySecret: accessKeySecret,
          stsToken: securityToken,
        };
      },
    };

    const client = new OSS(options);

    return client;
  };

  signatureUrl = async (name: string, options?: OSS.SignatureUrlOptions) => {
    const info = this.getInfo();

    const { prefix } = info;

    const client = await this.getClient();

    const res = client.signatureUrl(`${prefix}/${name}`, options);

    return res;
  };

  /**
   * 修改 GraphQL Schema
   */
  modifyGraphQLSchema: ModifyGraphQLSchema = (params) => {
    const { schemaComposer } = params;

    /**
     * 增加图片类型
     */
    {
      schemaComposer.createObjectTC({
        name: "Image",
        fields: {
          key: {
            description: "图片Key",
            type: () => "String!",
            resolve: (source, args, context, info) => {
              return source;
            },
          },

          // 图片下载 URL
          url: {
            description: "图片URL",
            type: () => "String!",
            args: {
              process: {
                type: "String",
                description: "图片处理参数",
              },
            },
            resolve: async (source, args, context, info) => {
              const res = this.signatureUrl(source, args);

              return res;
            },
          },
        },
      });
    }

    /**
     * 增加查询字段
     */
    {
      const newFields: ObjectTypeComposerFieldConfigMapDefinition<any, any> =
        {};

      /**
       * 增加图片查询字段
       */
      {
        const graphqlFieldName = "image";

        const resolve: ResolverRpCb<any, any, any> = async ({
          source,
          args,
          context,
          info,
        }) => {
          return args.key;
        };

        const fieldResolver = schemaComposer.createResolver({
          name: graphqlFieldName,
          type: "Image!",
          args: {
            key: "String!",
          },
          resolve,
        });

        newFields[graphqlFieldName] = fieldResolver;
      }

      /**
       * Query 下增加上传 URL
       * @tutorial https://help.aliyun.com/zh/oss/use-cases/uploading-objects-to-oss-directly-from-clients/#36c322a137x9q
       */
      {
        const graphqlFieldName = "uploadUrl";

        const resolve: ResolverRpCb<any, any, any> = async ({
          source,
          args,
          context,
          info,
        }) => {
          const options = args?.options || {};

          const res = this.signatureUrl(uuidV4(), {
            ...options,
            method: "PUT",
          });

          return res;
        };

        const fieldResolver = schemaComposer.createResolver({
          name: graphqlFieldName,
          type: "String!",
          args: {
            options: "JSON",
          },
          resolve,
        });

        newFields[graphqlFieldName] = fieldResolver;
      }

      schemaComposer.Query.addFields(newFields);
    }
  };
}
