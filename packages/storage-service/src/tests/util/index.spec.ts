import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { StorageService } from "../..";

describe("storage service", () => {
  test("download", async () => {
    const storageService = new StorageService({
      id: "test",
      type: "STORAGE",
      settings: {
        uri: "https://ali-oss-credentials.ldsgy.com/credential?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWdpb24iOiJjbi1oYW5nemhvdSIsImJ1Y2tldCI6Imxkc2d5LXN0b3JhZ2UiLCJwcmVmaXgiOiJ0ZXN0IiwiZXh0ZXJuYWxJZCI6InRlc3RFeHRlcm5hbElkIn0.-PbjxIvj51jekT2doSQhuycvuvwj_2yvD04YX_QaqoE",
      },
    });

    expect(storageService.getType()).toBe("STORAGE");

    const alibabaCloudOssInfo = storageService.getInfo();

    expect(alibabaCloudOssInfo).toMatchSnapshot();

    const client = await storageService.getClient();

    expect(client).toBeDefined();

    const signatureUrlRes = await storageService.signatureUrl("test.jpg");

    const axiosRes = await axios(signatureUrlRes);

    expect(axiosRes.status).toBe(200);
  });

  test("upload", async () => {
    const storageService = new StorageService({
      id: "test",
      type: "STORAGE",
      settings: {
        uri: "https://ali-oss-credentials.ldsgy.com/credential?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWdpb24iOiJjbi1oYW5nemhvdSIsImJ1Y2tldCI6Imxkc2d5LXN0b3JhZ2UiLCJwcmVmaXgiOiJ0ZXN0IiwiZXh0ZXJuYWxJZCI6InRlc3RFeHRlcm5hbElkIn0.-PbjxIvj51jekT2doSQhuycvuvwj_2yvD04YX_QaqoE",
      },
    });

    expect(storageService.getType()).toBe("STORAGE");

    const alibabaCloudOssInfo = storageService.getInfo();

    expect(alibabaCloudOssInfo).toMatchSnapshot();

    const client = await storageService.getClient();

    expect(client).toBeDefined();

    const signatureUrlRes = await storageService.signatureUrl("test-new.jpg", {
      method: "PUT",
      "Content-Type": "application/x-www-form-urlencoded",
    });

    expect(signatureUrlRes).toBeDefined();

    const testJpgPath = path.join(__dirname, "test.jpg");

    const file = await fs.readFile(testJpgPath);

    const axiosRes = axios(signatureUrlRes, {
      method: "put",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: file,
    });

    const response = await axiosRes;

    expect(response.status).toBe(200);
  });
});
