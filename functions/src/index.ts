/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import 'dotenv/config';
import { defineSecret } from 'firebase-functions/params';

// Define the OPENAI_API_KEY secret
defineSecret('OPENAI_API_KEY');

// This is a trick to ensure that the files in the `ai` directory are
// included in the build. It does not actually do anything.
(async () => {
    try {
        await import('../../src/ai/dev.js');
    } catch (e) {
        // do nothing
    }
})();
