<script lang="ts">
	import { get, writable } from 'svelte/store';
	import { onMount } from "svelte";
	import { fly } from 'svelte/transition';
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { auth, db, storage, collection, getDocs, query, orderBy, addDoc, ref, uploadBytes, getDownloadURL } from "$lib/firebase";
	import * as Card from '$lib/components/ui/card';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';

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
		businessNumberOfEmployees: "",
		businessGrowthRate: "",
		postalCode: "",
		lastFourMonthsTurnover: "",
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
		whereDidYouHearAboutUs: "",
		registeredWithSARS: "",
		taxCompliance: "",
		bbbbeeCertificate: "",
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
		documents: [] // 🔹 Store file URLs here
	});

	// ✅ Update fullName dynamically when firstName or lastName changes
	function updateFullName() {
		formData.update(data => ({
			...data,
			fullName: `${data.firstName} ${data.lastName}`.trim()
		}));
	}

	const minWordCount = {
		businessDescription: 200,
		motivation: 200,
		challenges: 200,
	};


	const softwareAreas = ["Accounting & Finance", "Human Resources", "Marketing", "Risk Management", "Other"]
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
		const user = auth.currentUser;

		// 🔹 Extract program details from URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const programID = urlParams.get("programID");
		const programName = urlParams.get("programName");
		const programCategory = urlParams.get("programCategory");

		// ✅ Update form data with program details from URL
		formData.update(data => ({
			...data,
			programID: programID || "",
			programName: programName || "",
			programCategory: programCategory || ""
		}));

		// 🔹 Fetch user data from Firestore if logged in
		if (user) {
			const userId = await getUserIdByEmail(user.email);
			if (userId) {
				await fetchApplicationData(userId);
			}
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
	const updateSoftwareArea = (area: string) => {
		formData.update(data => {
			// Ensure `softwareAreas` exists
			const updatedSoftwareAreas = data.softwareAreas || {};

			// Toggle selection
			let updatedArea = updatedSoftwareAreas[area] || [];
			if (updatedArea.includes(area)) {
				updatedArea = updatedArea.filter(i => i !== area);
			} else {
				updatedArea.push(area);
			}

			return {
				...data,
				softwareAreas: {
					...updatedSoftwareAreas,
					[area]: updatedArea
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

	$: selectedRegisteredWithSARS = $formData.registeredWithSARS
		? {
			label: $formData.registeredWithSARS,
			value: $formData.registeredWithSARS
		}
		: undefined;
	$: selectedBusinessAddressProvince = $formData.businessAddressProvinces
			? {
				label: $formData.businessAddressProvinces,
				value: $formData.businessAddressProvinces
			}
			: undefined;
	$: selectedBusinessAddressLocation = $formData.businessAddressLocation
		? {
			label: $formData.businessAddressLocation,
			value: $formData.businessAddressLocation
		}
		: undefined;
	// Calculate Business Growth Rate
	$: formData.update(data => {
		if (data.revenueFor2022 && data.revenueFor2023) {
			const revenue2022 = parseFloat(data.revenueFor2022);
			const revenue2023 = parseFloat(data.revenueFor2023);
			data.businessGrowthRate = revenue2022 > 0 ? ((revenue2023 / revenue2022) - 1).toFixed(2) : "N/A";
		}
		return data;
	});

	// File Input Binding
	let selectedFiles = [];

	// Handle File Selection
	const handleFileSelection = async (event) => {
		const file = event.target.files[0];
		const fieldName = event.target.id;

		if (!file) return;

		try {
			const user = auth.currentUser;
			if (!user) {
				alert("You need to be logged in to upload files.");
				return;
			}

			const userId = await getUserIdByEmail(user.email);
			if (!userId) {
				alert("User not found in Firestore.");
				return;
			}

			const storageRef = ref(storage, `uploads/${userId}/${fieldName}/${file.name}`);
			const snapshot = await uploadBytes(storageRef, file);
			const downloadURL = await getDownloadURL(snapshot.ref);

			formData.update((data) => ({
				...data,
				documents: { ...data.documents, [fieldName]: downloadURL } // Store URL
			}));

			alert(`${file.name} uploaded successfully!`);
		} catch (error) {
			console.error("🔥 File Upload Error:", error);
			alert("Error uploading file. Please try again.");
		}
	};


	// Function to Generate Application ID
	const generateApplicationID = async (userId) => {
		const currentYear = new Date().getFullYear();
		const currentDay = new Date().getDate().toString().padStart(2, "0"); // Ensure 2-digit format (e.g., "05")

		// 🔹 Get the user's applications collection
		const applicationsCollection = collection(db, `Users/${userId}/Applications`);
		const q = query(applicationsCollection, orderBy("applicationID", "desc"));

		// 🔹 Fetch existing applications
		const querySnapshot = await getDocs(q);
		let lastNumber = 0;

		if (!querySnapshot.empty) {
			const lastApplication = querySnapshot.docs[0].data();
			const lastAppID = lastApplication.applicationID; // Example: "2024/001234/07"

			// Extract the middle number (NNNNNN) from the last applicationID
			const match = lastAppID.match(/\/(\d{6})\//);
			if (match) {
				lastNumber = parseInt(match[1]); // Extracted 001234 -> 1234
			}
		}

		// 🔹 Generate next application number
		const newApplicationNumber = (lastNumber + 1).toString().padStart(6, "0"); // Ensure 6-digit format (e.g., "001235")

		// 🔹 Construct final Application ID
		return `${currentYear}/${newApplicationNumber}/${currentDay}`;
	};

	const getUserIdByEmail = async (email: string) => {
		try {
			const usersRef = collection(db, "Users"); // Reference Users collection
			const q = query(usersRef);
			const querySnapshot = await getDocs(q);

			let userId = null;

			querySnapshot.forEach((doc) => {
				const userData = doc.data();
				if (userData.userEmail === email) {
					userId = doc.id; // Get Firestore document ID
				}
			});

			return userId;
		} catch (error) {
			console.error("🔥 Error fetching user ID:", error);
			return null;
		}
	};

	const submitToAI = async (applicationData) => {
		try {
			console.log("📡 Sending application data to AI Scoring API...");

			const response = await fetch("https://rairo-ai-screener.hf.space/api/evaluate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(applicationData),
			});

			const result = await response.json();
			console.log("✅ Raw AI Response:", result);

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
					console.log("✅ Parsed AI Evaluation:", aiEvaluation);
				} catch (parseError) {
					console.error("🔥 Error parsing AI evaluation JSON:", parseError);
				}
			}

			return {
				aiRecommendation: aiEvaluation?.["AI Recommendation"] || "Unknown",
				aiScore: aiEvaluation?.["AI Score"] || 0,
				aiJustification: aiEvaluation?.["Justification"] || "No justification provided",
			};
		} catch (error) {
			console.error("🔥 Error submitting to AI Screener:", error);
			return null;
		}
	};

	// ✅ Validate South African ID Number (13-digit with checksum)
	function isValidSouthAfricanID(idNumber: string): boolean {
		if (!/^\d{13}$/.test(idNumber)) return false; // Must be exactly 13 digits

		// Extract the birthdate (YYMMDD)
		const birthYear = parseInt(idNumber.substring(0, 2), 10);
		const birthMonth = parseInt(idNumber.substring(2, 4), 10);
		const birthDay = parseInt(idNumber.substring(4, 6), 10);

		// Convert YY to YYYY (assume 1900s for 00-99, 2000s for 00-24)
		const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of the year
		const fullYear = birthYear > currentYear ? 1900 + birthYear : 2000 + birthYear;

		// Validate Date
		const birthDate = new Date(fullYear, birthMonth - 1, birthDay);
		if (
			birthDate.getFullYear() !== fullYear ||
			birthDate.getMonth() + 1 !== birthMonth ||
			birthDate.getDate() !== birthDay
		) {
			return false;
		}

		// **Luhn Algorithm Check**
		const digits = idNumber.split("").map(Number);
		let sum = 0;
		let alternate = false;

		for (let i = digits.length - 1; i >= 0; i--) {
			let num = digits[i];

			if (alternate) {
				num *= 2;
				if (num > 9) num -= 9;
			}

			sum += num;
			alternate = !alternate;
		}

		return sum % 10 === 0;
	}
	// ✅ Auto-format Registration Number (YYYY/NNNNNN/06)
	function formatRegistrationNumber(value: string) {
		// Remove non-digit characters
		let digits = value.replace(/\D/g, "").slice(0, 10); // Max 10 digits
		if (digits.length < 10) return digits;

		// Format as YYYY/NNNNNN/06
		return `${digits.slice(0, 4)}/${digits.slice(4, 10)}/06`;
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
		2: ["revenueFor2022", "revenueFor2023", "revenueFor2024", "employeesFor2022", "employeesFor2023","employeesFor2024", "registeredWithSARS"],
		3: ["motivation"],
		4: ["documents"] // Ensure at least one document is uploaded
	};

	// Navigation Functions
	function countWords(text: string) {
		return text.trim().split(/\s+/).filter(word => word.length > 0).length;
	}

	function validateStep() {
		const step = get(currentStep);
		if (step === undefined || step < 0 || step >= steps.length) {
			console.error("❌ Invalid step index.");
			return false;
		}

		const stepFields = requiredFields[step];
		if (!stepFields) return true; // No required fields

		const formValues = get(formData);
		let isValid = true;
		let missingFields = [];
		let wordCountErrors = [];

		stepFields.forEach((field) => {
			const value = formValues[field];
			if (!value || (Array.isArray(value) && value.length === 0)) {
				isValid = false;
				missingFields.push(field);
			}
			if (minWordCount[field] && typeof value === "string") {
				const wordCount = countWords(value);
				if (wordCount < minWordCount[field]) {
					isValid = false;
					wordCountErrors.push(`${field} must have at least ${minWordCount[field]} words (currently ${wordCount} words)`);
				}
			}
		});

		if (!isValid) {
			let errorMessage = "";
			if (missingFields.length > 0) {
				errorMessage += `❌ Missing fields: ${missingFields.join(", ")}.\n`;
			}
			if (wordCountErrors.length > 0) {
				errorMessage += `⚠️ Word count issues:\n${wordCountErrors.join("\n")}`;
			}
			alert(errorMessage);
		}

		return isValid;
	}

	function nextStep() {
		if (!validateStep()) return; // Prevent moving to next step if validation fails

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
		setTimeout(updateModalMessage, 2000); // Change message every 2 seconds
	};

	const requiredDocuments = [
    "cipc-upload",
    "bbbbee-certificate",
    "company-profile-upload",
    "id-copy",
    "bank-statement-upload"
];

	const validateDocuments = () => {
		const form = get(formData);
		const missingDocs = requiredDocuments.filter(doc => !form.documents[doc]);

		if (missingDocs.length > 0) {
			alert(`❌ Please upload the following documents before submitting: ${missingDocs.join(", ")}`);
			return false;
		}
		return true;
	};

	const submitForm = async () => {
		try {
			if (!validateDocuments()) return;

			showModal.set(true); // Show loading modal
			updateModalMessage();

			const user = auth.currentUser;
			if (!user) {
				alert("User not logged in!");
				showModal.set(false);
				return;
			}

			const userId = await getUserIdByEmail(user.email);
			if (!userId) {
				alert("User not found in Firestore!");
				showModal.set(false);
				return;
			}

			// Generate Application ID
			const applicationID = await generateApplicationID(userId);

			// Extract form data
			const form = get(formData);

			// Save application to Firestore
			const applicationsCollection = collection(db, `Users/${userId}/Applications`);
			await addDoc(applicationsCollection, {
				applicationID,
				...form,
				submittedAt: new Date(),
			});

			showModal.set(false);
			alert("🎉 Application submitted successfully!");
			goto('/track-application/tracker');

		} catch (error) {
			console.error("🔥 Firestore Error:", error);
			alert("Error submitting application. Please try again.");
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
<div class="flex flex-col items-center">
	<Card.Header class="text-center">
		<Card.Title class="text-xl font-semibold">DUT CSE Rapid Incubation Program Application</Card.Title>
	</Card.Header>

	<!-- Step Container -->
	<div class="mx-auto h-[500px] w-[1200px] rounded-lg p-6 shadow-md mb-2">
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
						/>
						<Label for="last-name">Surname</Label>
						<Input
							id="last-name"
							bind:value={$formData.lastName}
							placeholder="Enter your surname"
							on:input={updateFullName}
						/>
						<Label for="applicant-id-number">ID Number</Label>
						<Input
							id="applicant-id-number"
							bind:value={$formData.applicantIDNumber}
							placeholder="Enter Your ID Number"
							on:blur={() => {
								if (!isValidSouthAfricanID($formData.applicantIDNumber)) {
									alert("❌ Invalid ID Number Format!");
									formData.update(data => ({ ...data, applicantIDNumber: "" }));
								}
							}}
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
								<Select.Item value="phd">PhD</Select.Item>
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
						/>
						<Label for="nature-business">Nature of Business</Label>
						<Input
							id="nature-business"
							bind:value={$formData.natureOfBusiness}
							placeholder="Industry/Type of Services"
						/>
						<Label for="business-description">Briefly describe your business (Min: 200 words)</Label>
						<Textarea
							id="business-description"
							bind:value={$formData.businessDescription}
							placeholder="Describe your business"
							on:input={() => minWordCount.businessDescription = countWords($formData.businessDescription)}
						/>
						<p class="word-count {countWords($formData.businessDescription) < 200 ? 'warning' : ''}">
							Word count: {countWords($formData.businessDescription)} / 200
						</p>
						<Label for="years-of-trading">Number of years of trading</Label>
						<Input
							id="years-of-trading"
							bind:value={$formData.yearsOfTrading}
							placeholder="Enter number of years"
							on:input={(e) => formData.update(data => ({ ...data, yearsOfTrading: validateYearsOfTrading(e.target.value) }))}
						/>
						<Label for="registration-number">Registration Number</Label>
						<Input
							id="registration-number"
							bind:value={$formData.registrationNumber}
							placeholder="Enter Your Registration Number"
							on:input={(e) => formData.update(data => ({ ...data, registrationNumber: formatRegistrationNumber(e.target.value) }))}
						/>
						<Label for="date-registration">Date of Registration</Label>
						<Input id="date-registration" type="date" bind:value={$formData.dateOfRegistration} />



						<Label for="business-name">Business Address</Label>
						<Input
							id="business-name"
							bind:value={$formData.businessAddress}
							placeholder="Enter your business address"
						/>
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

						<Label for="business-name">Postal Code</Label>
						<Input
							id="business-name"
							bind:value={$formData.postalCode}
							placeholder="Enter your business address"
						/>

						<Card.Root class="mx-auto w-[950px]">
							<Card.Header>
								<Card.Title class="text-lg font-small text-center">Website And Business Social Media Links</Card.Title>
							</Card.Header>
							<Card.Content>
								<div class="flex flex-row justify-between my-4">
									<Label for="website-address">Website Address</Label>
									<Input
										id="website-address"
										bind:value={$formData.socialMediaWebsiteAddress}
										placeholder="Enter your business website address"
										class="w-[350px]"
									/>
								</div>
								<div class="flex flex-row justify-between my-4">
									<Label for="social-media-x-address">X (Formerly Twitter) Address</Label>
									<Input
										id="social-media-x-address"
										bind:value={$formData.socialMediaXAddress}
										placeholder="Enter your business X (Formerly Twitter) address"
											class="w-[350px]"
									/>
								</div>
								<div class="flex flex-row justify-between my-4">
									<Label for="social-media-instagram-address">Instagram Address</Label>
									<Input
										id="social-media-instagram-address"
										bind:value={$formData.socialMediaInstagramAddress}
										placeholder="Enter your business Instagram address"
											class="w-[350px]"
									/>
								</div>
								<div class="flex flex-row justify-between my-4">
									<Label for="social-media-facebook-address">Facebook Address</Label>
									<Input
										id="social-media-facebook-address"
										bind:value={$formData.socialMediaFacebookAddress}
										placeholder="Enter your business Facebook address"
											class="w-[350px]"
									/>
								</div>
								<div class="flex flex-row justify-between my-4">
									<Label for="social-media-linkedin-address">LinkedIn</Label>
									<Input
										id="social-media-linkedin-address"
										bind:value={$formData.socialMediaLinkedInAddress}
										placeholder="Enter your business LinkedIn address"
											class="w-[350px]"
									/>
								</div>
								<div class="flex flex-row justify-between my-4">
									<Label for="social-media-other">Other</Label>
									<Input
										id="social-media-other"
										bind:value={$formData.socialMediaOtherAddress}
										placeholder="Enter any other platform link"
											class="w-[350px]"
									/>
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
							<div class="grid grid-cols-2 gap-4">
								{#each [2022, 2023, 2024] as year}
									<div class="flex items-center gap-2">
										<Label for="revenueFor{year}" class="w-40">Revenue for {year}</Label>
										<Input
												id="revenueFor{year}"
												type="number"
												class="w-40"
												bind:value={$formData[`revenueFor${year}`]}
												on:input={(e) => formData.update(data => ({ ...data, [`revenueFor${year}`]: parseFloat(e.target.value) || 0 }))}
												placeholder="Enter revenue"
										/>
									</div>
									<div class="flex items-center gap-2">
										<Label for="employeesFor{year}" class="w-40">Employees for {year}</Label>
										<Input
												id="employeesFor{year}"
												type="number"
												class="w-40"
												bind:value={$formData[`employeesFor${year}`]}
												on:input={(e) => formData.update(data => ({ ...data, [`employeesFor${year}`]: parseInt(e.target.value) || 0 }))}
												placeholder="Enter employees"
										/>
									</div>
								{/each}
							</div>

							<h3 class="text-lg font-medium">Enter your revenue and employees for the past four months</h3>

							<!-- 🔹 Monthly Data -->
							<div class="grid grid-cols-2 gap-4">
								{#each [1, 2, 3, 4] as month}
									<div class="flex items-center gap-2">
										<Label for="revenueForMonth{month}" class="w-40">Revenue (Month {month})</Label>
										<Input
												id="revenueForMonth{month}"
												type="number"
												class="w-40"
												bind:value={$formData[`revenueForMonth${month}`]}
												on:input={(e) => formData.update(data => ({ ...data, [`revenueForMonth${month}`]: parseFloat(e.target.value) || 0 }))}
												placeholder="Enter revenue"
										/>
									</div>
									<div class="flex items-center gap-2">
										<Label for="employeesForMonth{month}" class="w-40">Employees (Month {month})</Label>
										<Input
												id="employeesForMonth{month}"
												type="number"
												class="w-40"
												bind:value={$formData[`employeesForMonth${month}`]}
												on:input={(e) => formData.update(data => ({ ...data, [`employeesForMonth${month}`]: parseInt(e.target.value) || 0 }))}
												placeholder="Enter employees"
										/>
									</div>
								{/each}
							</div>
						</Card.Content>

						<Label for="sars-registration">Registered with SARS?</Label>
						<Select.Root
								selected={selectedRegisteredWithSARS}
								onSelectedChange={(v) => {
                        if (v) {
                            $formData.registeredWithSARS = v.value;
                        }
                    }}
						>
							<Select.Trigger id="sars-registration">
								<Select.Value placeholder="Select" />
							</Select.Trigger>
							<Select.Content>
								{#each participationOptions as option}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>

						<input hidden bind:value={$formData.registeredWithSARS} name="registeredWithSARS" />
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
						<Label for="motivation">Why do you want to join?</Label>
						<Textarea
							id="motivation"
							bind:value={$formData.motivation}
							placeholder="Explain your motivation"
						/>
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
						{#each requiredDocuments as doc}
							{#let humanReadableName = doc.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}

							<Label for={doc}>{humanReadableName}</Label>
							<Input
									id={doc}
									type="file"
									accept=".pdf,.doc,.docx,.jpg,.png"
									on:change={handleFileSelection}
							/>

							{#if $formData.documents[doc]}
								<p class="text-green-500">✅ {humanReadableName} uploaded</p>
							{:else}
								<p class="text-red-500">❌ {humanReadableName} not uploaded</p>
							{/if}
						{/each}
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
