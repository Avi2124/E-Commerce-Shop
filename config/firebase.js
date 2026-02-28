import admin from "firebase-admin";

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined
};

if(!admin.apps.length){
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin intialized");
}

export const sendPushToTokens = async ({tokens, title, body, data = {}}) => {
    if(!tokens || tokens.length === 0) return;
    try {
        const message = {notification: {title, body}, data, tokens};
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log("Push multicast result: ", response.successCount, "success");
        return response;
    } catch (error) {
        console.error("Push semd error: ", error.message);
    }
};