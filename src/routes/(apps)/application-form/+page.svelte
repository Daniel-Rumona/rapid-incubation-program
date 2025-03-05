<script lang="ts">
	import { get, writable } from 'svelte/store';
	import { onMount } from "svelte";
	import { fly } from 'svelte/transition';
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { auth, db, storage, collection, getDocs, query, orderBy, addDoc, ref, uploadBytes, getDownloadURL } from "$lib/firebase";
	import { doc, runTransaction } from "firebase/firestore"; 
	import * as Card from '$lib/components/ui/card';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { httpsCallable } from "firebase/functions";
	import { functions } from "$lib/firebase"; // Import Firebase functions

	// Step Control
	let currentStep = writable(0);

	// Form Data Store
	let formData = writable({
		programID: "",
		programName: "",
		programCategory: "",
		firstName: "",
		lastName:"",
		fullName: "",
		applicantGender:"",
		applicantAge:"",
		applicantIDNumber:"",
		applicantDisability:"",
		applicantAcademicQualification: "",
		areYouDUTStudent: "",
		phoneNumber: "",
		businessName: "",
		yearsOfTrading:"",
		registrationNumber: "",
		dateOfRegistration: "",
		businessAddress: "",
		businessAddressProvince: "",
		businessAddressCity:"",
		businessAddressLocation: "",
		businessEmail: "",
		socialMediaWebsiteAddress:"",
		socialMediaInstagramAddress:"",
		socialMediaXAddress:"",
		socialMediaFacebookAddress:"",
		socialMediaLinkedInAddress:"",
		socialMediaOtherAddress:"",
		natureOfBusiness: "",
		businessDescription: "",
		businessGrowthRate: "",
		postalCode: "",
		selectedMonths:[],
		revenueFor2022:"",
		revenueFor2023:"",
		revenueFor2024:"",
		employeesFor2022:"",
		employeesFor2023:"",
		employeesFor2024:"",
		revenueForMonth1:"",
		revenueForMonth2:"",
		revenueForMonth3:"",
		revenueForMonth4:"",
		employeesForMonth1:"",
		employeesForMonth2:"",
		employeesForMonth3:"",
		employeesForMonth4:"",
		taxClearance: "",
		motivation: "",
		challenges: "",
		softwareAreas: {
			"Accounting & Finance": [],
			"Human Resources": [],
			"Marketing": [],
			"Risk Management": [],
			"Other": []
		},
		interventions: {
			"Marketing and Sales": [],
			"Financial Management & Systems": [],
			"Regulatory Compliance": [],
			"Business Mentorship & Coaching": [],
			"Technical Training & Webinars": [],
			"Operational Support": [],
			"Growth Plan": [],
			"Project Management": []
		},
		documents: []
	});

	// ✅ Update fullName dynamically when firstName or lastName changes
	function updateFullName() {
		formData.update(data => ({
			...data,
			fullName: `${data.firstName} ${data.lastName}`.trim()
		}));
	}

	const minWordCount = {
		businessDescription: 100,
		motivation: 100
	};


	const softwareAreas = ["Financial Management", "Human Resources", "Marketing", "Risk Management", "Other"]
	const sections = {
		"Marketing and Sales": [
			"Website Development & Domain Email Registration", "Website Hosting", "Company Logo",
			"Social Media", "Industry Membership", "Company Profile",
			"Email Signature", "Business Cards", "Branded Banner",
			"Pamphlets Brochures", "Access To Market & Linkages", "Marketing Plan",
			 "CRM Solutions", "Other Marketing Support"
		],
		"Financial Management & Systems": [
			"Management Accounts", "Financial Management Templates",
			"Record Keeping And Management", "Business Funding Proposal",
			"Funding Linkages"
		],
		"Regulatory Compliance": [
			"Insurance Tips Webinar", "Regulatory Compliance (VAT UIF COIDA Registration)",
			"Risk Management Plan", "Human Resources Management Support ",
			"Food Compliance Guidance"
		],
		"Business Mentorship & Coaching": [
			"Financial Literacy Mentoring", "Marketing Mentoring",
			"Executive Mentoring", "Business Operational Plan", "Strategic Plan",
			"Business Communication (How To Pitch)", "Digital Transformation"
		],
		"Technical Training & Webinars": [
			"Excel Skills Training", "Industry Seminars", "Fireside Chat",
			"Industry Training", "Powerpoint"
		],
		"Operational Support": [
			"Tools And Equipment Time", "Data Support", "Technology Application Support", "AI Readiness Support"
		],
		"Project Management": ["Project Facilitation", "Other Support"]
	};

	onMount(async () => {
    try {
        // 🔹 Wait for Firebase Auth to initialize and retrieve user ID
        const userId = await getUserID();
        
        if (userId) {
            console.log("✅ User authenticated with UID:", userId);
            await fetchApplicationData(userId);
        } else {
            console.log("⚠️ No authenticated user found.");
        }

        // 🔹 Extract program details from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const programID = urlParams.get("programID");
        const programName = urlParams.get("programName");
        const programCategory = urlParams.get("programCategory");
        const lastFourMonths = getLastFourMonths();

        // ✅ Update form data with program details from URL
        formData.update(data => ({
            ...data,
            selectedMonths: lastFourMonths,
            programID: programID || "",
            programName: programName || "",
            programCategory: programCategory || ""
        }));

    } catch (error) {
        console.error("🔥 Error in onMount:", error);
    }
});


	// Participation Options
	const participationOptions = [
		{ label: "Yes", value: "Yes" },
		{ label: "No", value: "No" }
	];

	const updateInterventions = (category: string, item: string) => {
		formData.update((data) => {
			let updatedCategory = [...data.interventions[category]];

			// Toggle selection
			if (updatedCategory.includes(item)) {
				updatedCategory = updatedCategory.filter(i => i !== item);
			} else {
				updatedCategory.push(item);
			}

			return {
				...data,
				interventions: {
					...data.interventions,
					[category]: updatedCategory
				}
			};
		});
	};
	const updateSoftwareArea = (category: string) => {
		formData.update((data) => {
			let updatedCategory = [...(data.softwareAreas[category] || [])];

			// ✅ Toggle selection
			if (updatedCategory.length > 0) {
				updatedCategory = [];
			} else {
				updatedCategory = category === "Other" ? [""] : [category];
			}

			return {
				...data,
				softwareAreas: {
					...data.softwareAreas,
					[category]: updatedCategory
				}
			};
		});
	};


	// Steps for Navigation
	const steps = [
		{ id: 0, name: 'Personal Details' },
		{ id: 1, name: 'Business Information' },
		{ id: 2, name: 'Financial & Resource Information' },
		{ id: 3, name: 'Motivation & Challenges' },
		{ id: 4, name: 'Compliance & Certification' }
	];


	$: selectedGender = $formData.applicantGender
		? {
			label: $formData.applicantGender,
			value: $formData.applicantGender
		}
		: undefined;
	$: selectedDisability = $formData.applicantDisability
		? {
			label: $formData.applicantDisability,
			value: $formData.applicantDisability
		}
		: undefined;
	$: selectedAcademicQualification = $formData.applicantAcademicQualification
		? {
			label: $formData.applicantAcademicQualification,
			value: $formData.applicantAcademicQualification
		}
		: undefined;

	$: selectedAreYouDUTStudent = $formData.areYouDUTStudent
		? {
			label: $formData.areYouDUTStudent,
			value: $formData.areYouDUTStudent
		}
		: undefined;

	$: selectedValidTaxPin = $formData.validTaxPin
		? {
			label: $formData.validTaxPin,
			value: $formData.validTaxPin
		}
		: undefined;
	$: selectedBusinessAddressLocation = $formData.businessAddressLocation
		? {
			label: $formData.businessAddressLocation,
			value: $formData.businessAddressLocation
		}
		: undefined;
	$: selectedBusinessAddressProvince = $formData.businessAddressProvince
		? {
			label: $formData.businessAddressProvince,
			value: $formData.businessAddressProvince
		}
		: undefined;
	// Calculate Business Growth Rate
	$: {
    const revenue2022 = parseFloat($formData.revenueFor2022) || 0;
    const revenue2023 = parseFloat($formData.revenueFor2023) || 0;
    const revenue2024 = parseFloat($formData.revenueFor2024) || 0;

    let growthRate = "N/A";

    if (revenue2022 > 0 && revenue2023 > 0) {
        growthRate = (((revenue2023 - revenue2022) / revenue2022) * 100).toFixed(2) + "%";
    }

    if (revenue2023 > 0 && revenue2024 > 0) {
        growthRate = (((revenue2024 - revenue2023) / revenue2023) * 100).toFixed(2) + "%";
    }

    formData.set({ ...$formData, businessGrowthRate: growthRate });
}


	// File Input Binding
	let selectedFiles: File[] = [];
	const handleFileSelection = (event: Event) => {
    		const input = event.target as HTMLInputElement;
    	if (input.files) {
        const newFiles = Array.from(input.files);
        selectedFiles = [...selectedFiles, ...newFiles]; // 🔹 Append instead of replace
        console.log("📂 Current selected files:", selectedFiles.map(file => file.name));
    }
};

function getLastFourMonths(): string[] {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    const today = new Date();
    let months = [];

    for (let i = 1; i <= 4; i++) {
        let monthIndex = today.getMonth() - i;
        let year = today.getFullYear();

        if (monthIndex < 0) {
            monthIndex += 12;
            year -= 1;
        }

        months.push(`${monthNames[monthIndex]} ${year}`);
    }

    return months.reverse(); // Ensure chronological order
}


	// Function to Generate Application ID
	const generateApplicationID = async () => {
    const currentYear = new Date().getFullYear();
    const currentDay = new Date().getDate().toString().padStart(2, "0"); // Ensures a two-digit format (e.g., "03")

    const counterRef = doc(db, "ApplicationCounter", "global");

    try {
        return await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            let totalApplications = counterDoc.exists() ? counterDoc.data().count || 0 : 0;

            const newApplicationNumber = (totalApplications + 1).toString().padStart(6, "0");
            const newApplicationID = `${currentYear}/${newApplicationNumber}/${currentDay}`;

            // ✅ Save the new counter value
            transaction.set(counterRef, { count: totalApplications + 1 });

            // ✅ Ensure the transaction returns the application ID
            return newApplicationID;
        });
    } catch (error) {
        console.error("🔥 Error generating unique application ID:", error);
        throw new Error("Failed to generate application ID.");
    }
};

const getUserID = async (): Promise<string | null> => {
    return new Promise((resolve) => {
        if (auth.currentUser) {
            resolve(auth.currentUser.uid); // ✅ User is already logged in
        } else {
            // ✅ Listen for authentication state changes
            const unsubscribe = auth.onAuthStateChanged((user) => {
                resolve(user ? user.uid : null);
                unsubscribe(); // ✅ Stop listening after getting user state
            });
        }
    });
};


	const submitToAI = async (applicationData) => {
		try {
		
			const response = await fetch("https://rairo-ai-screener.hf.space/api/evaluate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(applicationData),
			});

			const result = await response.json();

			// 🔹 Check if `raw_response` exists and contains valid JSON
			let aiEvaluation = null;
			if (result.evaluation && result.evaluation.raw_response) {
				try {
					// Remove triple backticks (```) and parse the inner JSON
					const cleanedJsonString = result.evaluation.raw_response
						.replace(/^```json/, '')  // Remove starting ```
						.replace(/```$/, '')       // Remove ending ```
						.trim();                    // Trim whitespace

					aiEvaluation = JSON.parse(cleanedJsonString);
				
				} catch (parseError) {
					return null;
				}
			}

			return {
				aiRecommendation: aiEvaluation?.["AI Recommendation"] || "Unknown",
				aiScore: aiEvaluation?.["AI Score"] || 0,
				aiJustification: aiEvaluation?.["Justification"] || "No justification provided",
			};
		} catch (error) {
			return null;
		}
	};


	// ✅ Auto-format Registration Number (YYYY/NNNNNN/06)
	function formatRegistrationNumber(value: string): string {
    // 🔹 Remove any non-numeric characters except slashes
    let digits = value.replace(/\D/g, "");

    // 🔹 Ensure we have at least 10 digits for standard formatting
    if (digits.length < 10) return value; // Return unchanged if not enough digits

    // 🔹 Extract parts
    let year = digits.slice(0, 4); // First 4 digits = Year
    let sequence = digits.slice(4, 10); // Next 6 digits = Unique Number
    let suffix = digits.length > 10 ? digits.slice(10) : ""; // Any extra digits (suffix)

    // 🔹 If the value is already formatted, return it
    if (value.match(/^\d{4}\/\d{6}\/\d{2}$/)) return value;

    // 🔹 Construct formatted string with slashes
    let formattedNumber = `${year}/${sequence}`;
    
    // 🔹 Append suffix only if it's present and valid
    if (suffix.length > 0) {
        formattedNumber += `/${suffix}`;
    }

    return formattedNumber;
}


	// ✅ Ensure age is limited to 2 digits only
	function validateAge(event: FocusEvent) {
		let value = (event.target as HTMLInputElement).value.trim(); // Get input value
		let numericValue = value.replace(/\D/g, ""); // Remove non-numeric characters

		if (numericValue.length !== 2 || parseInt(numericValue, 10) < 10 || parseInt(numericValue, 10) > 99) {
			alert("❌ Enter a valid age (10-99)");
			(event.target as HTMLInputElement).value = ""; // Clear the field
			$formData.applicantAge = "";
		} else {
			$formData.applicantAge = numericValue; // Set valid age
		}
	}

	// ✅ Ensure years of trading is 1 or 2 digits only
	function validateYearsOfTrading(value: string) {
		return value.replace(/\D/g, "").slice(0, 2); // Allow only up to 2 digits
	}
	// Modal Visibility
	let showModal = writable(false);
	let modalMessage = writable("Processing your application...");

	// Array of messages to show while submitting
	const loadingMessages = [
		"Scanning Documents...",
		"Verifying Authenticity...",
		"Checking Compliance...",
		"Uploading Your Application...",
		"Finalizing Submission..."
	];
	const requiredFields = {
		0: ["fullName", "applicantGender", "applicantIDNumber", "applicantAge", "applicantAcademicQualification", "areYouDUTStudent"],
		1: ["businessName", "natureOfBusiness", "businessDescription", "yearsOfTrading", "registrationNumber", "dateOfRegistration", "businessAddress", "postalCode"],
		2: ["revenueFor2022", "revenueFor2023", "revenueFor2024", "revenueForMonth1","revenueForMonth2","revenueForMonth3","revenueForMonth4", "employeesFor2022", "employeesFor2023","employeesFor2024",
			"employeesForMonth1","employeesForMonth2","employeesForMonth3","employeesForMonth4", "validTaxPin"],
		3: ["motivation"],
		4: ["documents"]	
	};
const requiredDocuments = [
    "cipc-upload",
    "bbbbee-certificate",
    "company-profile-upload",
    "id-copy",
    "tax-clearance-upload",
    "bank-statement-upload"
];


	// Navigation Functions
	function countWords(text: string) {
		return text.trim().split(/\s+/).filter(word => word.length > 0).length;
	}

	function validateStep() {
		const stepFields = requiredFields[get(currentStep)];
		if (!stepFields) return true; // No required fields for this step

		const formValues = get(formData);
		let isValid = true;
		let missingFields = [];
		let wordCountErrors = [];

		stepFields.forEach((field) => {
			const value = formValues[field];

			if (
				value === undefined || // Undefined value
				value === null || // Null value
				(typeof value === "string" && value.trim() === "") || // Empty string
				(typeof value === "number" && isNaN(value)) || // NaN check
				(Array.isArray(value) && value.length === 0) // Empty array (for checkboxes)
			) {
				isValid = false;
				missingFields.push(field);
			}

			// ✅ Check word count if the field is in minWordCount
			if (minWordCount[field] && typeof value === "string") {
    const wordCount = countWords(value);
    if (wordCount < minWordCount[field]) {
        isValid = false;
        wordCountErrors.push(
            `${fieldLabels[field] || field} must be at least ${minWordCount[field]} words. You have written ${wordCount} words.`
        );
        // ✅ Force focus back to the field
        setTimeout(() => document.getElementById(field)?.focus(), 50);
    }
}

		});

		const fieldLabels = {
			firstName: "First Name",
			lastName: "Last Name",
			fullName: "Full Name",
			applicantGender: "Gender",
			applicantAge: "Age",
			applicantIDNumber: "ID Number",
			areYouDUTStudent: "Are you a DUT Student",
			applicantAcademicQualification: "Academic Qualification",
			registrationNumber: "Registration Number",
			phoneNumber: "Phone Number",
			businessName: "Business Name",
			businessAddress: "Business Address",
			postalCode: "Postal Code",
			natureOfBusiness: "Nature of Business",
			businessDescription: "Business Description",
			yearsOfTrading: "Years of Trading",
			revenueFor2022: "Revenue for 2022",
			revenueFor2023: "Revenue for 2023",
			revenueFor2024: "Revenue for 2024",
			employeesFor2022: "Employees for 2022",
			employeesFor2023: "Employees for 2023",
			employeesFor2024: "Employees for 2024",
			selectedMonths:[],
			revenueForMonth1: "Revenue for Month 1",
			revenueForMonth2: "Revenue for Month 2",
			revenueForMonth3: "Revenue for Month 3",
			revenueForMonth4: "Revenue for Month 4",
			employeesForMonth1: "Employees for Month 1",
			employeesForMonth2: "Employees for Month 2",
			employeesForMonth3: "Employees for Month 3",
			employeesForMonth4: "Employees for Month 4",
			whereDidYouHearAboutUs: "Where Did You Hear About Us?",
			validTaxPin: "Valid Tax Pin?",
			documents: "Required Documents"
		};

		if (!isValid) {
			let errorMessage = "";

			if (missingFields.length > 0) {
				const readableMissingFields = missingFields.map(field => fieldLabels[field] || field);
				errorMessage += `❌ Please fill in the required fields: ${readableMissingFields.join(", ")}.\n`;
			}

			if (wordCountErrors.length > 0) {
				const readableWordCountErrors = wordCountErrors.map(error => {
					const [field, issue] = error.split(" must be at least ");
					return `${fieldLabels[field] || field} must be at least ${issue}`;
				});
				errorMessage += `⚠️ Word count issues:\n${readableWordCountErrors.join("\n")}`;
			}

			alert(errorMessage);
		}


		return isValid;
	}

	let validationError = writable(false); // Track if an error occurred

	function nextStep() {
	const formValues = get(formData);
	const businessDescWords = countWords(formValues.businessDescription);
	const motivationWords = countWords(formValues.motivation);

	// Prevent Navigation
	if (get(currentStep) === 1 && businessDescWords < 100) {
		validationError.set(true);
		return;
	}

	if (get(currentStep) === 3 && motivationWords < 100) {
		validationError.set(true);
		return;
	}

	// ✅ Move to the next step only if validation passes
	validationError.set(false);
	currentStep.update((step) => Math.min(step + 1, steps.length - 1));
}

	
	function prevStep() {
		currentStep.update((step) => Math.max(step - 1, 0));
	}
	// Function to cycle through messages
	let messageIndex = 0;
	const updateModalMessage = () => {
		modalMessage.set(loadingMessages[messageIndex % loadingMessages.length]);
		messageIndex++;
		setTimeout(updateModalMessage, 10000); // Change message every 2 seconds
	};

const submitForm = async () => {
// Prevent submission if word count is not met
	const formValues = get(formData);
	const businessDescWords = countWords(formValues.businessDescription);
	const motivationWords = countWords(formValues.motivation);

	if (businessDescWords < 100) {
		alert(`❌ Your business description must be at least 100 words. You have written ${businessDescWords} words.`);
		document.getElementById("business-description")?.focus();
		return;
	}

	if (motivationWords < 100) {
		alert(`❌ Your motivation must be at least 100 words. You have written ${motivationWords} words.`);
		document.getElementById("motivation")?.focus();
		return;
	}
    try {
        console.log("🚀 Starting form submission...");
        showModal.set(true);
        updateModalMessage();

        const user = auth.currentUser;
        if (!user) {
            console.error("❌ User not logged in!");
            alert("❌ You must be logged in to submit.");
            showModal.set(false);
            return;
        }

        const userId = user.uid;
        console.log("📌 Using UID for storage:", userId);

        if (!userId) {
            console.error("❌ User ID not found in Firestore.");
            alert("❌ User ID not found.");
            showModal.set(false);
            return;
        }

        // 🔹 Upload Documents to Firebase Storage
        console.log("📂 Selected files to upload:", selectedFiles);
        let uploadedFiles: string[] = [];

        for (let file of selectedFiles) {
            console.log(`📤 Uploading file: ${file.name}`);
            try {
                const storageRef = ref(storage, `application_files/${userId}/${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                uploadedFiles.push(downloadURL);
                console.log(`✅ Successfully uploaded: ${file.name}`);
            } catch (uploadError) {
                console.error(`🔥 Error uploading ${file.name}:`, uploadError);
                alert(`❌ Failed to upload ${file.name}`);
            }
        }

        console.log("📁 All uploaded document URLs:", uploadedFiles);

        const applicationID = await generateApplicationID(userId);
        console.log("🆔 Generated Application ID:", applicationID);

        const form = get(formData);
        console.log("📝 Form Data before submission:", form);

        // 🔍 **Eligibility Checks**
        let isRejected = false;
        let rejectionReason = "";

        if (form.businessAddressProvince !== "KwaZulu-Natal") {
            isRejected = true;
            rejectionReason = "Applicant is located outside KwaZulu-Natal."; 
        } else if (form.areYouDUTStudent === "Yes") {
            isRejected = true;
            rejectionReason = "Applicant is a current DUT student. Referred to InnoBiz.";
        }

        let aiResponse = { aiScore: 0, aiRecommendation: "Rejected", aiJustification: rejectionReason };

        // ✅ **Only send to AI if NOT rejected**
        if (!isRejected) {
            console.log("🤖 Sending application to AI for evaluation...");
            const applicationData = {
                company_name: form.businessName,
                company_registration_no: form.registrationNumber,
                no_of_years_trading: parseInt(form.yearsOfTrading || "0"),
                sector: form.natureOfBusiness,
                current_number_of_employees: parseInt(form.employeesFor2024 || "0"),
                current_business_turnover: parseInt(form.revenueFor2024 || "0"),
                business_description: form.businessDescription,
                tax_clearance: form.taxCompliance,
                initial_support: form.motivation,
            };

            aiResponse = await submitToAI(applicationData);
            console.log("🤖 AI Response:", aiResponse);
        } else {
            console.log("❌ Application automatically rejected:", rejectionReason);
        }

        // ✅ **Save Application to Firestore with AI Response**
        console.log("📝 Saving application to Firestore...");
        const applicationsCollection = collection(db, `Users/${userId}/Applications`);
        await addDoc(applicationsCollection, {
            applicationID,
            ...form,
            documents: uploadedFiles,
            submittedAt: new Date(),
            aiRecommendation: aiResponse.aiRecommendation,
            aiScore: aiResponse.aiScore,
            aiJustification: aiResponse.aiJustification,
            applicationStatus: aiResponse.aiRecommendation
        });

        console.log("✅ Application successfully saved in Firestore.");

        // ✅ **Send Email Notification for ALL Applicants**
        try {
            console.log("📧 Sending confirmation email...");
            const sendEmail = httpsCallable(functions, "sendApplicationEmail");
            await sendEmail({
                businessEmail: form.businessEmail,
                applicantName: form.fullName || `${form.firstName} ${form.lastName}`,
            });
            console.log("✅ Email sent successfully.");
        } catch (emailError) {
            console.error("🔥 Email sending failed:", emailError);
        }

        showModal.set(false);
        alert(`✅ Application Submitted Successfully! Check Your Email For Confirmation.`);
        goto('/track-application/tracker');

    } catch (error) {
        console.error("🔥 Error submitting application:", error);
        alert("❌ Error submitting application. Please try again.");
        showModal.set(false);
    }
};


	const fetchApplicationData = async (userId) => {
		try {
			const applicationsCollection = collection(db, `Users/${userId}/Applications`);
			const querySnapshot = await getDocs(applicationsCollection);

			if (!querySnapshot.empty) {
				const applicationData = querySnapshot.docs[0].data();
				formData.set({ ...applicationData });
			}
		} catch (error) {
			console.error("🔥 Error fetching application data:", error);
		}
	};
</script>
<!-- ✅ MODAL FOR LOADING SCREEN -->
{#if $showModal}
	<div class="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
		<div class="bg-accent p-6 rounded-lg shadow-lg text-center">
			<div class="flex justify-center items-center">
				<svg class="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
				</svg>
				<p class="text-lg font-medium">{$modalMessage}</p>
			</div>
		</div>
	</div>
{/if}

<!-- Form Wrapper -->
<div class="flex flex-col items-center w-full px-4 sm:px-6 md:px-8">
	<Card.Header class="text-center">
		<Card.Title class="text-xl font-semibold">DUT CSE Rapid Incubation Programm Application</Card.Title>
		<Card.Description>DUTCSERI collects and processes your application information to assess your suitability for our incubation program. We handle your data responsibly and in accordance with POPIA. By applying, you consent to this processing. For more details, please request our full POPIA policy</Card.Description>
	</Card.Header>

	<!-- Step Container -->
	<div class="mx-auto w-full max-w-4xl rounded-lg p-4 sm:p-6 shadow-md mb-2 overflow-auto">
		{#if $currentStep === 0}
			<div transition:fly={{ y: 20, opacity: 0 }} class="w-full">
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg font-medium">Step 1: Personal Details</Card.Title>
						<Card.Description>Provide some details about yourself.</Card.Description>
					</Card.Header>
					<Card.Content class="grid gap-6">
						<Label for="first-name">First Name</Label>
						<Input
							id="first-name"
							bind:value={$formData.firstName}
							placeholder="Enter your first name"
							on:input={updateFullName}
							class="w-full"
						/>
						<Label for="last-name">Surname</Label>
						<Input
							id="last-name"
							bind:value={$formData.lastName}
							placeholder="Enter your surname"
							on:input={updateFullName}
							class="w-full"
						/>
						<Label for="phone-number">Phone Number</Label>
						<Input id="phone-number" bind:value={$formData.phoneNumber} placeholder="Enter your phone number" class="w-full"/>
						<Label for="applicant-id-number">ID Number</Label>
						<Input
							id="applicant-id-number"
							bind:value={$formData.applicantIDNumber}
							placeholder="Enter Your ID Number"
							class="w-full"
						/>
						<Label for="gender">Select Gender</Label>
						<Select.Root
							selected={selectedGender}
							onSelectedChange={(v) => {
								if (v) {
									$formData.applicantGender = v.value;
								}
							}}
						>
							<Select.Trigger id="gender">
								<Select.Value placeholder="Select Gender" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="Male">Male</Select.Item>
								<Select.Item value="Female">Female</Select.Item>
							</Select.Content>
						</Select.Root>
						<input hidden bind:value={$formData.applicantGender} name="applicantGender" />
						<Label for="owner-age">Age</Label>
						<Input
							id="owner-age"
							type="text"
							bind:value={$formData.applicantAge}
							on:blur={validateAge}
							placeholder="Enter your age"
							class="w-full"
						/>
						<Label for="gender">Do You Have Any Disability</Label>
						<Select.Root
							selected={selectedDisability}
							onSelectedChange={(v) => {
								if (v) {
									$formData.applicantDisability = v.value;
								}
							}}
						>
							<Select.Trigger id="disability">
								<Select.Value placeholder="Select Response" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="Yes">Yes</Select.Item>
								<Select.Item value="No">No</Select.Item>
							</Select.Content>
						</Select.Root>
						<input hidden bind:value={$formData.applicantDisability} name="applicantDisability" />

						<Label for="academic-qualification">Academic Qualification</Label>

						<Select.Root
							selected={selectedAcademicQualification}
							onSelectedChange={(v) => {
								if (v) {
									$formData.applicantAcademicQualification = v.value;
								}
							}}
						>
							<Select.Trigger id="academic-qualification">
								<Select.Value placeholder="Select Response" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="Below Metric">Below Metric</Select.Item>
								<Select.Item value="Metric">Metric</Select.Item>
								<Select.Item value="Under Graduate">
									Under Graduate (Certificate, Diploma, Bachelors etc)
								</Select.Item>
								<Select.Item value="Post Graduate">
									Post Graduate (Honors, Post Graduate Diploma etc)
								</Select.Item>
								<Select.Item value="Masters">Masters</Select.Item>
								<Select.Item value="PhD">PhD</Select.Item>
							</Select.Content>
						</Select.Root>
						<input hidden bind:value={$formData.applicantAcademicQualification} name="applicantAcademicQualification" />

						<Label for="dut-student">Are You A DUT Student</Label>
						<Select.Root
							selected={selectedAreYouDUTStudent}
							onSelectedChange={(v) => {
								if (v) {
									$formData.areYouDUTStudent = v.value;
								}
							}}
						>
							<Select.Trigger id="dut-student">
								<Select.Value placeholder="Select Response" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="Yes">Yes</Select.Item>
								<Select.Item value="No">No</Select.Item>
							</Select.Content>
						</Select.Root>
						<input hidden bind:value={$formData.areYouDUTStudent} name="areYouDUTStudent" />

					<Card.Footer class="flex justify-end">
						<Button on:click={nextStep}>Next →</Button>
					</Card.Footer>
					</Card.Content>
				</Card.Root>
			</div>
		{/if}

		{#if $currentStep === 1}
			<div transition:fly={{ y: 20, opacity: 0 }} class="w-full">
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg font-medium">Step 2: Business Overview</Card.Title>
						<Card.Description>Describe your business operations and activities.</Card.Description>
					</Card.Header>

					<Card.Content class="grid gap-6">
						<Label for="business-name">Business Name</Label>
						<Input
							id="business-name"
							bind:value={$formData.businessName}
							placeholder="Enter your business name"
							class="w-full"
						/>
						<Label for="nature-business">Nature of Business</Label>
						<Input
							id="nature-business"
							bind:value={$formData.natureOfBusiness}
							placeholder="Industry/Type of Services"
							class="w-full"
						/>
						<!-- Business Description -->
<Textarea
	id="business-description"
	bind:value={$formData.businessDescription}
	placeholder="Describe your business (Min: 100 words)"
	on:blur={() => {
		const wordCount = countWords($formData.businessDescription);
		if (wordCount < 100) {
			validationError.set(true);
		} else {
			validationError.set(false);
		}
	}}
	class="w-full"
/>
<p class="word-count {countWords($formData.businessDescription) < 100 ? 'warning' : ''}">
	Word count: {countWords($formData.businessDescription)} / 100
</p>
{#if validationError && countWords($formData.businessDescription) < 100}
	<p class="text-red-500">❌ Business description must be at least 100 words.</p>
{/if}

						<Label for="years-of-trading">Number of years of trading</Label>
						<Input
							id="years-of-trading"
							bind:value={$formData.yearsOfTrading}
							placeholder="Enter number of years"
							on:input={(e) => formData.update(data => ({ ...data, yearsOfTrading: validateYearsOfTrading(e.target.value) }))}
							class="w-full"
						/>
						<Input
    id="registration-number"
    bind:value={$formData.registrationNumber}
    placeholder="Enter Your Registration Number"
    on:input={(e) => formData.update(data => ({ ...data, registrationNumber: formatRegistrationNumber(e.target.value) }))}
    class="w-full"
/>

						<Label for="date-registration">Date of Registration</Label>
						<Input id="date-registration" type="date" bind:value={$formData.dateOfRegistration} class="w-full"/>

						
							<Label for="email-address">Email Address</Label>
							<Input id="email-address" bind:value={$formData.businessEmail} placeholder="Enter your business email address" class="w-full" />

						<Label for="business-address">Business Address</Label>
						<Input
							id="business-address"
							bind:value={$formData.businessAddress}
							placeholder="Enter your business address"
							class="w-full"
						/>
						<Label for="business-name">Province</Label>
						<Select.Root
							selected={selectedBusinessAddressProvince}
							onSelectedChange={(v) => {
        if (v) {
            $formData.businessAddressProvince = v.value;
        }
    }}
						>
							<Select.Trigger id="business-address-province">
								<Select.Value placeholder="Select Province" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="Eastern Cape">Eastern Cape</Select.Item>
								<Select.Item value="Free State">Free State</Select.Item>
								<Select.Item value="Gauteng">Gauteng</Select.Item>
								<Select.Item value="KwaZulu-Natal">KwaZulu-Natal</Select.Item>
								<Select.Item value="Limpopo">Limpopo</Select.Item>
								<Select.Item value="Mpumalanga">Mpumalanga</Select.Item>
								<Select.Item value="North West">North West</Select.Item>
								<Select.Item value="Northern Cape">Northern Cape</Select.Item>
								<Select.Item value="Western Cape">Western Cape</Select.Item>
							</Select.Content>
						</Select.Root>
						<input hidden bind:value={$formData.businessAddressProvince} name="businessAddressProvince" />


						<Label for="business-address-city">City</Label>
						<Input
							id="business-address-city"
							bind:value={$formData.businessAddressCity}
							placeholder="Enter your business city"
						/>
						<Label for="business-address-location">Location</Label>
						<Select.Root
							selected={selectedBusinessAddressLocation}
							onSelectedChange={(v) => {
								if (v) {
									$formData.businessAddressLocation = v.value;
								}
							}}
						>
							<Select.Trigger id="business-adress-location">
								<Select.Value placeholder="Select Location" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="Urban">Urban</Select.Item>
								<Select.Item value="Township">Township</Select.Item>
								<Select.Item value="Rural">Rural</Select.Item>
							</Select.Content>
						</Select.Root>
						<input hidden bind:value={$formData.businessAddressLocation} name="businessAddressLocation" />
						<Label for="business-postsal-code">Postal Code</Label>
						<Input
							id="business-postsal-code"
							bind:value={$formData.postalCode}
							placeholder="Enter your business postal code"
							class="w-full"
						/>

						<Card.Root class="mx-auto w-full">
							<Card.Header>
								<Card.Title class="text-lg font-small text-center">Website And Business Social Media Links</Card.Title>
							</Card.Header>
							<Card.Content>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label for="website-address">Website Address</Label>
										<Input id="website-address" bind:value={$formData.socialMediaWebsiteAddress} placeholder="Enter your business website address" class="w-full" />
									</div>
									<div>
										<Label for="social-media-x-address">X (Formerly Twitter) Address</Label>
										<Input id="social-media-x-address" bind:value={$formData.socialMediaXAddress} placeholder="Enter your business X (Formerly Twitter) address" class="w-full" />
									</div>
									<div>
										<Label for="social-media-instagram-address">Instagram Address</Label>
										<Input id="social-media-instagram-address" bind:value={$formData.socialMediaInstagramAddress} placeholder="Enter your business Instagram address" class="w-full" />
									</div>
									<div>
										<Label for="social-media-facebook-address">Facebook Address</Label>
										<Input id="social-media-facebook-address" bind:value={$formData.socialMediaFacebookAddress} placeholder="Enter your business Facebook address" class="w-full" />
									</div>
									<div>
										<Label for="social-media-linkedin-address">LinkedIn</Label>
										<Input id="social-media-linkedin-address" bind:value={$formData.socialMediaLinkedInAddress} placeholder="Enter your business LinkedIn address" class="w-full" />
									</div>
									<div>
										<Label for="social-media-other">Other</Label>
										<Input id="social-media-other" bind:value={$formData.socialMediaOtherAddress} placeholder="Enter any other platform link" class="w-full" />
									</div>
								</div>
							</Card.Content>
						</Card.Root>

					</Card.Content>
					<Card.Footer class="flex justify-between">
						<Button variant="ghost" on:click={prevStep}>← Back</Button>
						<Button on:click={nextStep}>Next →</Button>
					</Card.Footer>
				</Card.Root>
			</div>
		{/if}

		{#if $currentStep === 2}
			<div transition:fly={{ y: 20, opacity: 0 }} class="w-full">
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg font-medium">Step 3: Finance & Performance</Card.Title>
					</Card.Header>
					<Card.Content class="grid gap-6">
						<Card.Content class="grid gap-6">
							<!-- 🔹 Yearly Data (2022 - 2024) -->
							{#each [2022, 2023, 2024] as year}
								<div class="grid grid-cols-3 gap-4">
									<Label for="revenue-{year}">Year: {year}</Label>
									<Input
										id="revenue-{year}"
										bind:value={$formData[`revenueFor${year}`]}
										placeholder="Revenue {year}"
type="number"
									/>
									<Input
										id="employees-{year}"
										bind:value={$formData[`employeesFor${year}`]}
										placeholder="Employees {year}"
type="number"
									/>
								</div>
							{/each}
							<h3 class="text-lg font-medium">Enter your revenue and employees for the past four months</h3>
							<!-- 🔹 Monthly Data -->
							{#each $formData.selectedMonths as month, index}
    <div class="grid grid-cols-3 gap-4">
        <Label for="revenue-{index}">Month: {month}</Label>
        <Input
            id="revenue-{index}"
            bind:value={$formData[`revenueForMonth${index + 1}`]}
            placeholder="Revenue"
type="number"
        />
        <Input
            id="employees-{index}"
            bind:value={$formData[`employeesForMonth${index + 1}`]}
            placeholder="Employees"
type="number"
        />
    </div>
{/each}

						</Card.Content>
						<Label for="valid-tax-pin">Do You Have A Valid Tax Pin (Clearance)?</Label>

						<Select.Root
							selected={selectedValidTaxPin}
							onSelectedChange={(v) => {
    if (v) {
      $formData.validTaxPin = v.value;
    }
  }}
						>
							<Select.Trigger id="valid-tax-pin">
								<Select.Value placeholder="Select" />
							</Select.Trigger>
							<Select.Content>
								{#each participationOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>

						<input hidden bind:value={$formData.validTaxPin} name="validTaxPin" />

					</Card.Content>
					<Card.Footer class="flex justify-between">
						<Button variant="ghost" on:click={prevStep}>← Back</Button>
						<Button on:click={nextStep}>Next →</Button>
					</Card.Footer>
				</Card.Root>
			</div>
		{/if}

		{#if $currentStep === 3}
			<div transition:fly={{ y: 20, opacity: 0 }} class="w-full">
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg font-medium">Step 4: Motivation & Challenges</Card.Title>
					</Card.Header>
					<Card.Content class="grid gap-6">
						<!-- Motivation -->
<Textarea
	id="motivation"
	bind:value={$formData.motivation}
	placeholder="Explain your motivation (min 100 words)"
	on:blur={() => {
		const wordCount = countWords($formData.motivation);
		if (wordCount < 100) {
			validationError.set(true);
		} else {
			validationError.set(false);
		}
	}}
	class="w-full"
/>
<p class="word-count {countWords($formData.motivation) < 100 ? 'warning' : ''}">
	Word count: {countWords($formData.motivation)} / 100
</p>
{#if validationError && countWords($formData.motivation) < 100}
	<p class="text-red-500">❌ Motivation must be at least 100 words.</p>
{/if}


					</Card.Content>
					<Card.Content class="grid gap-6">
						<Label for="intervention-selection">What form of intervention do you need?</Label>
						<Accordion.Root type="multiple">
							{#each Object.keys(sections) as category}
								<Accordion.Item value={category}>
									<!-- Click to expand -->
									<Accordion.Trigger>
										<div class="flex justify-between items-center w-full px-4 py-2 rounded-md cursor-pointer">
											<span class="font-semibold">{category}</span>
										</div>
									</Accordion.Trigger>
									<!-- Show checkboxes when clicked -->
									<Accordion.Content class="px-4 py-2 rounded-md">
										<div class="grid grid-cols-2 gap-4">
											<!-- Left Column -->
											<div>
												{#each sections[category].slice(0, Math.ceil(sections[category].length / 2)) as item}
													<div class="flex items-center gap-2 mb-2">
														<Checkbox
															checked={$formData.interventions[category].includes(item)}
															on:click={() => updateInterventions(category, item)}
														/>
														<Label>{item}</Label>
													</div>
												{/each}
											</div>

											<!-- Right Column -->
											<div>
												{#each sections[category].slice(Math.ceil(sections[category].length / 2)) as item}
													<div class="flex items-center gap-2 mb-2">
														<Checkbox
															checked={$formData.interventions[category].includes(item)}
															on:click={() => updateInterventions(category, item)}
														/>
														<Label>{item}</Label>
													</div>
												{/each}
											</div>
										</div>
									</Accordion.Content>
								</Accordion.Item>
							{/each}
						</Accordion.Root>
					</Card.Content>
					<Card.Content class="grid gap-6">
						<Label for="intervention-selection">Does Your Business Currently Have Any Form Of System In Use?</Label>
						<div class="grid gap-6">
							<!-- ✅ Loop through softwareAreas and create checkboxes -->
							<div class="grid gap-2">
								{#each softwareAreas as area}
									<div class="flex items-center gap-2">
										<Checkbox
											checked={$formData.softwareAreas?.[area]?.includes(area) || false}
											on:click={() => updateSoftwareArea(area)}
										/>
										<Label>{area}</Label>
									</div>
								{/each}

								<!-- ✅ Show Textbox if "Other" is Selected -->
								{#if $formData.softwareAreas?.["Other"]?.length > 0}
									<div class="flex flex-col gap-2 mt-2">
										<Label for="other-system">Please specify:</Label>
										<Input
											id="other-system"
											bind:value={$formData.softwareAreas.Other[0]}
											placeholder="Specify other system"
											class="w-full"
										/>
									</div>
								{/if}
							</div>
						</div>
					</Card.Content>
					<Card.Footer class="flex justify-between">
						<Button variant="ghost" on:click={prevStep}>← Back</Button>
						<Button on:click={nextStep}>Next →</Button>
					</Card.Footer>
				</Card.Root>
			</div>
		{/if}

		{#if $currentStep === 4}
			<div transition:fly={{ y: 20, opacity: 0 }} class="w-full">
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg font-medium">Final Step: Upload Documents</Card.Title>
						<Card.Description
							>Please upload all relevant certificates and documents.</Card.Description
						>
					</Card.Header>
					<Card.Content class="grid gap-6">
						<Label for="cipc-upload">Upload CIPC</Label>
						<Input
							id="cipc-upload"
							type="file"
							accept=".pdf,.doc,.docx,.jpg,.png"
							on:change={handleFileSelection}
						/>
						<Label for="bbbbee-certificate">Upload BBBEE Certificate</Label>
						<Input
							id="bbbbee-certificate"
							type="file"
							accept=".pdf,.doc,.docx,.jpg,.png"
							on:change={handleFileSelection}
						/>
						<Label for="company-profile-upload">Upload Company Profile</Label>
						<Input
							id="company-profile-upload"
							type="file"
							accept=".pdf,.doc,.docx,.jpg,.png"
							on:change={handleFileSelection}
						/>
						<Label for="id-copy">Upload Certified Copy Of ID</Label>
						<Input
							id="id-copy"
							type="file"
							accept=".pdf,.doc,.docx,.jpg,.png"
							on:change={handleFileSelection}
						/>
<Label for="tax-clearance-upload">Upload Tax Clearance
						</Label>
						<Input
							id="tax-clearance-upload"
							type="file"
							accept=".pdf,.doc,.docx,.jpg,.png"
							on:change={handleFileSelection}
						/>
						<Label for="bank-statement-upload">Upload Business Bank Statement (last 4 months)
						</Label>
						<Input
							id="bank-statement-upload"
							type="file"
							accept=".pdf,.doc,.docx,.jpg,.png"
							on:change={handleFileSelection}
						/>
					</Card.Content>
					<Card.Footer class="flex justify-between">
						<Button variant="ghost" on:click={prevStep}>← Back</Button>
						<Button on:click={submitForm} class="rounded bg-green-500 px-4 py-2 text-white">
							Submit ✅
						</Button>
					</Card.Footer>
				</Card.Root>
			</div>
		{/if}
	</div>
</div>

<style>
    .word-count {
        font-size: 0.9rem;
        color: gray;
        margin-top: 4px;
    }
    .word-count.warning {
        color: red;
    }
</style>
