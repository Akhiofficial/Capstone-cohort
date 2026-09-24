import "dotenv/config";
import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const projectId = process.env.PROJECT_ID;
const bucketName = "cohort-codespace-bucket-capstone";
const localDirectory = "/workspace";

// Recursive function to get all files in directory, ignoring node_modules and dotfiles
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== "node_modules" && !file.startsWith(".")) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (!file.startsWith(".")) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

async function initialSync() {
  console.log("Starting initial sync...");
  
  // Check if S3 has any files with the projectId prefix
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: `${projectId}/`
  });
  
  const response = await s3Client.send(listCommand);
  const s3Files = response.Contents || [];
  
  if (s3Files.length === 0) {
    console.log("No files found in S3 for this project. Uploading local files...");
    
    // Ensure localDirectory exists before reading
    if (fs.existsSync(localDirectory)) {
        const allFiles = getAllFiles(localDirectory);
        for (const filePath of allFiles) {
            try {
                const fileContent = fs.readFileSync(filePath);
                
                // Normalizing path to create relative S3 key
                const relativePath = filePath.replace(path.normalize(localDirectory), "").replace(/\\/g, "/").replace(/^\//, "");
                const s3Key = `${projectId}/${relativePath}`;
                
                const uploadCommand = new PutObjectCommand({
                    Bucket: bucketName,
                    Key: s3Key,
                    Body: fileContent,
                });
                await s3Client.send(uploadCommand);
                console.log(`Uploaded ${filePath} to ${s3Key}`);
            } catch (err) {
                console.error(`Failed to upload ${filePath}`, err);
            }
        }
    } else {
        console.log(`Local directory ${localDirectory} does not exist.`);
    }
  } else {
    console.log(`Found ${s3Files.length} files in S3. Downloading to local directory...`);
    
    for (const file of s3Files) {
      if (file.Key.endsWith("/")) continue; // Skip directory objects
      
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: file.Key
      });
      
      try {
          const { Body } = await s3Client.send(getCommand);
          const relativePath = file.Key.replace(`${projectId}/`, "");
          const localFilePath = path.join(localDirectory, relativePath);
          
          // Ensure local directory exists
          const dir = path.dirname(localFilePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          const byteArray = await Body.transformToByteArray();
          fs.writeFileSync(localFilePath, byteArray);
          console.log(`Downloaded ${file.Key} to ${localFilePath}`);
      } catch(err) {
          console.error(`Failed to download ${file.Key}`, err);
      }
    }
  }
  
  console.log("Initial sync complete. Starting watcher...");
  startWatcher();
}

function startWatcher() {
    chokidar.watch(localDirectory, { 
        ignored: [/(^|[\/\\])\../, /node_modules/], // ignore dotfiles (like .env) and node_modules
        persistent: true,
        ignoreInitial: true // Do not trigger add events for existing files upon startup
    }).on("all", async (event, filePath) => {
        if (event === "add" || event === "change") {
            try {
                // Read file content
                const fileContent = fs.readFileSync(filePath);
                
                // Generate S3 key (handling both Windows and Unix path separators)
                const relativePath = filePath.replace(path.normalize(localDirectory), "").replace(/\\/g, "/").replace(/^\//, "");
                const s3Key = `${projectId}/${relativePath}`;
                
                // Upload to S3
                const command = new PutObjectCommand({
                    Bucket: bucketName,
                    Key: s3Key,
                    Body: fileContent,
                });
                await s3Client.send(command);
                console.log(`Successfully synced ${filePath} to S3 as ${s3Key}`);
            } catch (error) {
                console.error(`Error syncing ${filePath} to S3:`, error);
            }
        }
    });
}

// Start the process
initialSync().catch(console.error);
