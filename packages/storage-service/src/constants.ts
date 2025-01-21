import { SettingsSchema } from "@ldsg/core";

export const STORAGE_SERVICE_DEFAULT_SETTINGS_SCHEMA: SettingsSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      title: "名称",
      description: "具有辨识度的名称",
    },
    description: {
      type: "string",
      title: "描述",
      description: "用于注释",
    },
    uri: {
      type: "string",
      title: "URI",
      description: "通过 URI 包含服务所需配置信息",
    },
  },
  required: ["uri"],
};
