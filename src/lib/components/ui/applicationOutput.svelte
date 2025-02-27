<script>
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";

	export let isOpen = false;
	const application = {
		status: "success",
		application_id: "2022/001234/07",
		evaluation: {
			"Quant-AI Recommendation": "Accept",
			"Quant-AI Score": 18,
			"Justification": "The business has a clear and innovative idea, operates in a high-growth sector, and has demonstrated strong potential. However, scaling strategies and market penetration plans need refinement."
		}
	};

	function closeModal() {
		isOpen = false;
	}
</script>

<Dialog open={isOpen} on:close={closeModal}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Application Evaluation</DialogTitle>
			<DialogDescription>Here is the AI-generated recommendation.</DialogDescription>
		</DialogHeader>
		<div class="space-y-2">
			<p><strong>Application ID:</strong> {application.application_id}</p>
			<p><strong>Quant-AI Recommendation:</strong> {application.evaluation["Quant-AI Recommendation"]}</p>
			<p><strong>Quant-AI Score:</strong> {application.evaluation["Quant-AI Score"]}</p>
			<p><strong>Justification:</strong> {application.evaluation["Justification"]}</p>
		</div>
		<Button on:click={closeModal}>Close</Button>
	</DialogContent>
</Dialog>
