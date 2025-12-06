import { baseURL } from "./../../config/axiosInstance";
import axios from "axios";
import { handleError } from "./handleError";

export function appendImagetoForm(uri: any, formdata: any, name: any) {
  // extract the filetype
  let fileType = uri.substring(uri.lastIndexOf(".") + 1);

  console.log(fileType);
  console.log(uri);
  // formdata.append(name, {
  //         uri,
  //         name: photo.${fileType},
  //         type: image/${fileType}
  // });
  formdata.append(name, {
    uri,
    // name: photo.${fileType},
    // type: image/${fileType}
  });
}

export async function uploadToS3(uri: string, signedUrl: string) {
  console.log("signedUrl", signedUrl);
  console.log("uri", uri);

  if (signedUrl) {
    try {
      const imgResponse = await fetch(uri);
      console.log("imgResponse", imgResponse);
      const blob = await imgResponse.blob();
      // console.log("blob", blob);
      // console.log("making fetch blob post");
      const response = await fetch(signedUrl, {
        method: "PUT",
        body: blob,
      });

      console.log("response", imgResponse);
      console.log("response image upload 1", response);
      console.log("response image upload 2", response.json());
      console.log("url", response.url);
      if (response.status === 200) {
        return response.url;
      } else {
        console.log("failed in if");
        console.log(response.status);
        return false;
      }
    } catch (e: any) {
      console.log("failed in else");
      console.log("failed in else exception", e.message);
      // handleError(e)
      // return false;
      return "file Upload Failed";
    }
  }
  return false;
}

export async function uploadImage(image: any, signedUrl: any) {
  let imagePath = null;

  if (signedUrl) {
    const uploadResponse = await uploadToS3(image.uri, signedUrl);
    console.log("uploadResponse", uploadResponse);
    imagePath = uploadResponse;
  }

  return imagePath;
}

export async function uploadFile(file: any, signedUrl: string) {
  if (signedUrl) {
    const fileUrl = await uploadToS3(file.uri, signedUrl);
    return fileUrl;
  }
  return null;
}

export function getImageDetails(imageData: any) {
  console.log("getImageDetails", imageData);
  let uri = imageData.uri;
  let imageType = uri.slice(((uri.lastIndexOf(".") - 1) >>> 0) + 2);
  let imageName = uri.slice(((uri.lastIndexOf("/") - 1) >>> 0) + 2);

  let contentType = imageData.mimeType;

  if (imageType === "jpg") {
    imageType = "jpeg";
  }

  return {
    type: imageType,
    name: imageName,
    uri: uri,
    contentType: contentType,
  };
}

export function getMediaDetails(mediaData: any) {
  const uri = mediaData.uri || mediaData.path;
  const mimeType = mediaData.mimeType || mediaData.type || "";

  const extension = uri?.split(".").pop()?.toLowerCase() || "";
  const name = mediaData.fileName || uri?.split("/").pop() || `file.${extension || "dat"}`;
  const size = mediaData.size || 0;

  let contentType = mimeType;
  if (!contentType) {
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
      contentType = `video/${extension}`;
    } else {
      contentType = "application/octet-stream";
    }
  }

  return {
    uri,
    name,
    type: contentType,
    contentType,
    size,
  };
}

export function getFileDetails(fileData: any) {
  console.log("fileData utils", fileData);
  let uri = fileData.uri;
  let fileName = uri.slice(((uri.lastIndexOf("/") - 1) >>> 0) + 2);

  return {
    name: fileName,
    uri: uri,
    type: fileData.type,
    size: fileData.size,
  };
}

export const getPresignedUrl = async (imagePath: string, imageData: any, token: string) => {
  const filenameWithExtension = imageData.path.split("/").pop();

  try {
    const userData = {
      folder: `${imagePath}/${Date.now()}${Math.random()}.${filenameWithExtension.split(".")[1]}`,
      content_type: imageData.mime,
    };

    const response = await axios.post(
      `${baseURL}/aws/presigned-url`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.data) {
      return response.data.data;
    }
  } catch (error) {
    console.error("Error getting pre-signed URL:", error);
    throw error;
  }
};