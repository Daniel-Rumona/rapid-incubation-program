"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendApplicationEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
admin.initializeApp();
// ✅ Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
    host: "mail.quantilytix.com",
    port: 587,
    secure: false, // ✅ STARTTLS enabled
    auth: {
        user: "dutcseteam@quantilytix.com",
        pass: "NkmT3jtNJ3vjgFMB4tN7",
    },
    tls: {
        rejectUnauthorized: false, // ✅ Prevents SSL errors
    },
});
exports.sendApplicationEmail = functions.https.onCall(async (request, context) => {
    try {
        // ✅ Extract the actual data from request.data
        const data = request.data;
        if (!data.businessEmail) {
            throw new functions.https.HttpsError("invalid-argument", "Missing businessEmail.");
        }
        const mailOptions = {
            from: "DUT-CSERI <dutcseteam@quantilytix.com>",
            to: data.businessEmail,
            subject: "Thank You for Applying to DUT-CSERI",
            html: `
          <p>Dear ${data.applicantName},</p>
          <p>Thank you for your interest in our incubation programme.</p>
          <p>Your application will be carefully reviewed. Check your status <a href="https://your-system-link.com">here</a>.</p>
          <p>Best Regards,<br><strong>DUT-CSERI</strong></p>
        `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent successfully to ${data.businessEmail}`);
        return { message: "✅ Email Sent Successfully!" };
    }
    catch (error) {
        console.error("🔥 Error sending email:", error);
        throw new functions.https.HttpsError("internal", "Failed to send email", error);
    }
});
//# sourceMappingURL=index.js.map