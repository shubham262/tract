"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Button, message } from "antd";
import { FiArrowLeft, FiCheckCircle, FiArchive, FiEdit2, FiSave, FiX } from "react-icons/fi";
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/apiClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const NEXT_STATUS = { DRAFT: "FINALIZED", FINALIZED: "ARCHIVED" };

export default function ContractDetailPage() {
	const router = useRouter();
	const { contractId } = useParams();
	const currentOrgId = useSelector((state) => state.org.currentOrgId);

	const [formData, setFormData] = useState({
		contract: null,
		events: [],
		loading: true,
		editing: false,
		editText: "",
		errors: [],
		saving: false,
		transitioning: false,
	});
	const eventSourceRef = useRef(null);

	const loadContract = useCallback(async () => {
		if (!currentOrgId) return;
		try {
			const [{ contract }, { events }] = await Promise.all([
				apiFetch(`/api/organizations/${currentOrgId}/contracts/${contractId}`),
				apiFetch(`/api/organizations/${currentOrgId}/contracts/${contractId}/events`),
			]);
			setFormData((prev) => ({ ...prev, contract, events, loading: false }));
		} catch (err) {
			message.error(err.message);
			setFormData((prev) => ({ ...prev, loading: false }));
		}
	}, [currentOrgId, contractId]);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (!session) return router.replace("/signin");
			if (!currentOrgId) return router.replace("/organizations");
			loadContract();
		});
	}, [currentOrgId, router, loadContract]);

	// Live status updates across tabs via SSE.
	useEffect(() => {
		if (!currentOrgId) return;
		let cancelled = false;

		supabase.auth.getSession().then(({ data: { session } }) => {
			if (cancelled || !session) return;
			const url = `${API_URL}/api/organizations/${currentOrgId}/contracts/stream?token=${session.access_token}`;
			const source = new EventSource(url);
			eventSourceRef.current = source;

			source.onmessage = (evt) => {
				try {
					const payload = JSON.parse(evt.data);
					if (payload.type === "contract_status_changed" && payload.contract.id === contractId) {
						setFormData((prev) => ({ ...prev, contract: payload.contract }));
						message.info(`Contract status changed to ${payload.contract.status}.`);
					}
				} catch {
					// ignore heartbeat/comment frames
				}
			};
		});

		return () => {
			cancelled = true;
			eventSourceRef.current?.close();
		};
	}, [currentOrgId, contractId]);

	const handleTransition = async (targetStatus) => {
		setFormData((prev) => ({ ...prev, transitioning: true }));
		try {
			const { contract } = await apiFetch(`/api/organizations/${currentOrgId}/contracts/${contractId}/status`, {
				method: "PATCH",
				body: JSON.stringify({ status: targetStatus }),
			});
			setFormData((prev) => ({ ...prev, contract, transitioning: false }));
			message.success(`Contract ${targetStatus.toLowerCase()}.`);
		} catch (err) {
			message.error(err.message);
			setFormData((prev) => ({ ...prev, transitioning: false }));
		}
	};

	const startEditing = () =>
		setFormData((prev) => ({
			...prev,
			editing: true,
			editText: JSON.stringify(prev.contract.fieldData, null, 2),
			errors: [],
		}));

	const handleSave = async (e) => {
		e.preventDefault();
		setFormData((prev) => ({ ...prev, saving: true, errors: [] }));

		let payload;
		try {
			payload = JSON.parse(formData.editText);
		} catch {
			setFormData((prev) => ({
				...prev,
				saving: false,
				errors: [{ field: "root", message: "That isn't valid JSON." }],
			}));
			return;
		}

		try {
			const { contract } = await apiFetch(`/api/organizations/${currentOrgId}/contracts/${contractId}`, {
				method: "PATCH",
				body: JSON.stringify(payload),
			});
			setFormData((prev) => ({ ...prev, contract, editing: false, saving: false }));
			message.success("Contract saved.");
			loadContract();
		} catch (err) {
			setFormData((prev) => ({
				...prev,
				saving: false,
				errors: err.details || [{ field: "root", message: err.message }],
			}));
		}
	};

	if (formData.loading) {
		return (
			<div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
				<p className="text-sm text-gray-500">Loading contract…</p>
			</div>
		);
	}
	if (!formData.contract) {
		return (
			<div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
				<p className="text-sm text-gray-500">Contract not found.</p>
			</div>
		);
	}

	const { contract, events } = formData;
	const nextStatus = NEXT_STATUS[contract.status];

	return (
		<div className="flex flex-1 flex-col items-center bg-white px-6 py-12">
			<div className="flex w-full max-w-3xl flex-col gap-6">
				<button
					onClick={() => router.push("/contracts")}
					className="flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
				>
					<FiArrowLeft /> Back to contracts
				</button>

				<div className="flex items-center justify-between">
					<div className="flex flex-col gap-1">
						<h1 className="text-2xl font-semibold text-gray-900">{contract.clientName}</h1>
						<span className="text-sm text-gray-500">PO {contract.poRefNo}</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
							{contract.status}
						</span>
						{contract.status === "DRAFT" && !formData.editing && (
							<Button icon={<FiEdit2 />} onClick={startEditing}>
								Edit
							</Button>
						)}
						{nextStatus && (
							<Button
								type="primary"
								icon={nextStatus === "FINALIZED" ? <FiCheckCircle /> : <FiArchive />}
								loading={formData.transitioning}
								onClick={() => handleTransition(nextStatus)}
							>
								{nextStatus === "FINALIZED" ? "Finalize" : "Archive"}
							</Button>
						)}
					</div>
				</div>

				{formData.editing ? (
					<form onSubmit={handleSave} className="flex flex-col gap-3">
						<textarea
							value={formData.editText}
							onChange={(e) => setFormData((prev) => ({ ...prev, editText: e.target.value }))}
							rows={16}
							className="w-full rounded-md border border-gray-300 p-3 font-mono text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
						/>
						{formData.errors.length > 0 && (
							<div className="flex flex-col gap-1 rounded-md border border-red-200 bg-red-50 p-3">
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
						<div className="flex gap-2">
							<Button type="primary" htmlType="submit" icon={<FiSave />} loading={formData.saving}>
								Save
							</Button>
							<Button icon={<FiX />} onClick={() => setFormData((prev) => ({ ...prev, editing: false }))}>
								Cancel
							</Button>
						</div>
					</form>
				) : (
					<div className="flex flex-col gap-4 rounded-md border border-gray-100 p-4">
						<div className="flex flex-wrap gap-6 text-sm">
							<div className="flex flex-col">
								<span className="text-gray-500">PO Date</span>
								<span className="text-gray-900">{contract.fieldData.po_date}</span>
							</div>
							<div className="flex flex-col">
								<span className="text-gray-500">Payment Terms</span>
								<span className="text-gray-900">{contract.fieldData.payment_terms || "—"}</span>
							</div>
							<div className="flex flex-col">
								<span className="text-gray-500">Delivery Terms</span>
								<span className="text-gray-900">{contract.fieldData.delivery_terms || "—"}</span>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<span className="text-sm font-medium text-gray-700">Items</span>
							<div className="flex flex-col divide-y divide-gray-100 border-t border-gray-100">
								{contract.fieldData.items.map((item, i) => (
									<div key={i} className="flex items-center justify-between py-2 text-sm">
										<span className="text-gray-900">{item.description}</span>
										<span className="text-gray-500">
											{item.quantity} {item.quantity_unit || ""} × {item.unit_price} = {item.total}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium text-gray-700">Audit trail</span>
					<div className="flex flex-col divide-y divide-gray-100 border-t border-gray-100">
						{events.map((event) => (
							<div key={event.id} className="flex items-center justify-between py-2 text-sm">
								<span className="text-gray-900">{event.eventType}</span>
								<span className="text-xs text-gray-500">
									{new Date(event.createdAt).toLocaleString()} · {event.userId}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
