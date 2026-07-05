"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Button, message } from "antd";
import { FiUpload, FiArrowLeft } from "react-icons/fi";
import { supabase } from "@/config/supabase";
import { apiFetch } from "@/service";
import AppHeader from "@/components/AppHeader";

const SAMPLE_PLACEHOLDER = `{
  "client_name": "Acme Corp",
  "po_ref_no": "PO-1001",
  "po_date": "2026-01-15",
  "payment_terms": "Net 30",
  "delivery_terms": "FOB destination",
  "items": [
    { "description": "Widget A", "quantity": 10, "unit_price": 25.5 }
  ]
}`;

export default function NewContractPage() {
	const router = useRouter();
	const currentOrgId = useSelector((state) => state.org.currentOrgId);
	const [formData, setFormData] = useState({
		jsonText: "",
		submitting: false,
		errors: [],
		checking: true,
	});

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (!session) return router.replace("/signin");
			if (!currentOrgId) return router.replace("/organizations");
			setFormData((prev) => ({ ...prev, checking: false }));
		});
	}, [currentOrgId, router]);

	const handleFileSelect = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const text = await file.text();
		setFormData((prev) => ({ ...prev, jsonText: text }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setFormData((prev) => ({ ...prev, submitting: true, errors: [] }));

		let payload;
		try {
			payload = JSON.parse(formData.jsonText);
		} catch {
			setFormData((prev) => ({
				...prev,
				submitting: false,
				errors: [
					{
						field: "root",
						message: "That isn't valid JSON. Check for missing commas/quotes.",
					},
				],
			}));
			return;
		}

		try {
			const { contract } = await apiFetch(
				`/api/organizations/${currentOrgId}/contracts`,
				{
					method: "POST",
					body: JSON.stringify(payload),
				}
			);
			message.success("Contract created.");
			router.push(`/contracts/${contract.id}`);
		} catch (err) {
			setFormData((prev) => ({
				...prev,
				submitting: false,
				errors: err.details || [{ field: "root", message: err.message }],
			}));
		}
	};

	if (formData.checking) {
		return (
			<div className="flex flex-1 flex-col bg-white">
				<AppHeader />
				<div className="flex flex-1 items-center justify-center px-6 py-12">
					<p className="text-sm text-gray-500">Loading…</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col bg-white">
			<AppHeader />
			<div className="flex flex-1 flex-col items-center px-6 py-12">
				<div className="flex w-full max-w-2xl flex-col gap-6">
					<button
						onClick={() => router.push("/contracts")}
						className="flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
					>
						<FiArrowLeft /> Back to contracts
					</button>

					<div className="flex flex-col gap-1">
						<h1 className="text-2xl font-semibold text-gray-900">
							Upload contract
						</h1>
						<p className="text-sm text-gray-500">
							Paste contract JSON below, or choose a .json file to load it into
							the editor.
						</p>
					</div>

					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<input
							type="file"
							accept=".json,application/json"
							onChange={handleFileSelect}
							className="text-sm"
						/>
						<textarea
							value={formData.jsonText}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, jsonText: e.target.value }))
							}
							placeholder={SAMPLE_PLACEHOLDER}
							rows={18}
							className="w-full rounded-md border border-gray-300 p-3 font-mono text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
						/>
						{formData.errors.length > 0 && (
							<div className="flex flex-col gap-1 rounded-md border border-red-200 bg-red-50 p-3">
								<p className="text-sm font-medium text-red-700">
									Please fix the following:
								</p>
								<ul className="list-disc pl-5 text-sm text-red-600">
									{formData.errors.map((err, i) => (
										<li key={i}>
											{err.field !== "root" ? `${err.field}: ` : ""}
											{err.message}
										</li>
									))}
								</ul>
							</div>
						)}
						<Button
							type="primary"
							htmlType="submit"
							icon={<FiUpload />}
							loading={formData.submitting}
						>
							Create contract
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
