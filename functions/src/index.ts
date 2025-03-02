import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
interface ApplicationData {
	businessEmail: string;
	applicantName: string;
}
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



export const sendApplicationEmail = functions.https.onCall(
	async (request, context) => {
		try {
			// ✅ Extract the actual data from request.data
			const data = request.data as ApplicationData;

			if (!data.businessEmail) {
				throw new functions.https.HttpsError("invalid-argument", "Missing businessEmail.");
			}

			const mailOptions: nodemailer.SendMailOptions = {
				from: "DUT-CSERI <dutcseteam@quantilytix.com>",
				to: data.businessEmail,
				subject: "Thank You for Applying to DUT-CSERI",
				html: `
          <p>Dear ${data.applicantName},</p>
          <p>Thank you for your interest in our incubation programme.</p>
          <p>Your application will be carefully reviewed. Check your status <a href="https://rapid-incubation-program.vercel.app/">here</a>.</p>
          <p>Best Regards,<br><strong>DUT-CSERI</strong></p>
        `,
			};

			await transporter.sendMail(mailOptions);

			console.log(`📧 Email sent successfully to ${data.businessEmail}`);
			return { message: "✅ Email Sent Successfully!" };
		} catch (error) {
			console.error("🔥 Error sending email:", error);
			throw new functions.https.HttpsError("internal", "Failed to send email", error);
		}
	}
);

