"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Input, Button, message } from "antd";
import {
	FiPlus,
	FiSearch,
	FiChevronLeft,
	FiChevronRight,
} from "react-icons/fi";
import { getContracts } from "@/service/contracts";

const PAGE_SIZE = 20;
const STATUS_STYLES = {
	DRAFT: "bg-gray-100 text-gray-700",
	FINALIZED: "bg-blue-100 text-blue-700",
	ARCHIVED: "bg-gray-200 text-gray-500",
};

export default function ContractsPage() {
	const currentOrgId = useSelector((state) => state.org.currentOrgId);

	const [formData, setFormData] = useState({
		contracts: [],
		total: 0,
		page: 1,
		status: "",
		q: "",
		loading: true,
	});

	const loadContracts = useCallback(
		async (page, status, q) => {
			if (!currentOrgId) return;
			let result = null;
			try {
				const params = { page, pageSize: PAGE_SIZE };
				if (status) params.status = status;
				if (q?.trim()) params.client = q.trim();

				result = await getContracts(currentOrgId, params);
			} catch (err) {
				message.error(err.message);
			} finally {
				setFormData((prev) => ({
					...prev,
					...(result && {
						contracts: result.contracts,
						total: result.total,
						page: result.page,
						status,
						q,
					}),
					loading: false,
				}));
			}
		},
		[currentOrgId]
	);

	useEffect(() => {
		loadContracts(1, "", "");
	}, [loadContracts]);

	const totalPages = Math.max(Math.ceil(formData.total / PAGE_SIZE), 1);

	if (formData.loading && formData.contracts.length === 0) {
		return <p className="text-sm text-gray-500">Loading contracts…</p>;
	}

	return (
		<div className="flex w-full max-w-4xl flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold text-gray-900">Contracts</h1>
				<Link href="/contracts/new">
					<Button type="primary" icon={<FiPlus />}>
						Upload contract
					</Button>
				</Link>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					loadContracts(1, formData.status, formData.q);
				}}
				className="flex flex-col gap-3 sm:flex-row"
			>
				<Input
					placeholder="Search by client name"
					value={formData.q}
					onChange={(e) =>
						setFormData((prev) => ({ ...prev, q: e.target.value }))
					}
					prefix={<FiSearch className="text-gray-400" />}
				/>
				<select
					value={formData.status}
					onChange={(e) => {
						const v = e.target.value;
						setFormData((prev) => ({ ...prev, status: v }));
						loadContracts(1, v, formData.q);
					}}
					className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 sm:w-48"
				>
					<option value="">All statuses</option>
					<option value="DRAFT">Draft</option>
					<option value="FINALIZED">Finalized</option>
					<option value="ARCHIVED">Archived</option>
				</select>
				<Button htmlType="submit">Search</Button>
			</form>

			<div className="flex flex-col divide-y divide-gray-100 border-t border-gray-100">
				{formData.contracts.length === 0 && (
					<p className="py-6 text-sm text-gray-500">No contracts found.</p>
				)}
				{formData.contracts.map((contract) => (
					<Link
						key={contract.id}
						href={`/contracts/${contract.id}`}
						className="flex items-center justify-between gap-4 py-4 hover:bg-gray-50"
					>
						<div className="flex flex-col">
							<span className="font-medium text-gray-900">
								{contract.clientName}
							</span>
							<span className="text-xs text-gray-500">
								PO {contract.poRefNo} · {contract.fieldData?.po_date}
							</span>
						</div>
						<span
							className={`rounded-full px-3 py-1 text-xs font-medium ${
								STATUS_STYLES[contract.status]
							}`}
						>
							{contract.status}
						</span>
					</Link>
				))}
			</div>

			{formData.total > PAGE_SIZE && (
				<div className="flex items-center justify-between">
					<Button
						icon={<FiChevronLeft />}
						disabled={formData.page <= 1}
						onClick={() =>
							loadContracts(formData.page - 1, formData.status, formData.q)
						}
					>
						Previous
					</Button>
					<span className="text-sm text-gray-500">
						Page {formData.page} of {totalPages}
					</span>
					<Button
						icon={<FiChevronRight />}
						iconPlacement="end"
						disabled={formData.page >= totalPages}
						onClick={() =>
							loadContracts(formData.page + 1, formData.status, formData.q)
						}
					>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}
