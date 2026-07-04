"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { Input, Button, message } from "antd";
import { FiPlus, FiCheck, FiFileText } from "react-icons/fi";
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/apiClient";
import { setOrganizations, setCurrentOrgId } from "@/redux/orgSlice";

const CURRENT_ORG_STORAGE_KEY = "tract:currentOrgId";

export default function OrganizationsPage() {
	const router = useRouter();
	const dispatch = useDispatch();
	const userInfo = useSelector((state) => state.auth.userInfo);
	const { organizations, currentOrgId } = useSelector((state) => state.org);

	const [formData, setFormData] = useState({ name: "", creating: false, loading: true });

	const loadOrganizations = useCallback(async () => {
		try {
			const { organizations: orgs } = await apiFetch("/api/organizations");
			dispatch(setOrganizations(orgs));

			const storedId = window.localStorage.getItem(CURRENT_ORG_STORAGE_KEY);
			const validStoredId = orgs.find((o) => o.id === storedId)?.id;

			if (validStoredId) {
				dispatch(setCurrentOrgId(validStoredId));
			} else if (orgs.length > 0) {
				dispatch(setCurrentOrgId(orgs[0].id));
				window.localStorage.setItem(CURRENT_ORG_STORAGE_KEY, orgs[0].id);
			}
		} catch (err) {
			message.error(err.message);
		} finally {
			setFormData((prev) => ({ ...prev, loading: false }));
		}
	}, [dispatch]);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (!session) {
				router.replace("/signin");
				return;
			}
			loadOrganizations();
		});
	}, [loadOrganizations, router]);

	const handleSelect = (orgId) => {
		dispatch(setCurrentOrgId(orgId));
		window.localStorage.setItem(CURRENT_ORG_STORAGE_KEY, orgId);
	};

	const handleCreate = async (e) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			message.error("Organization name is required.");
			return;
		}

		setFormData((prev) => ({ ...prev, creating: true }));

		try {
			await apiFetch("/api/organizations", {
				method: "POST",
				body: JSON.stringify({ name: formData.name.trim() }),
			});

			message.success("Organization created.");
			setFormData((prev) => ({ ...prev, name: "" }));
			await loadOrganizations();
		} catch (err) {
			message.error(err.message);
		} finally {
			setFormData((prev) => ({ ...prev, creating: false }));
		}
	};

	if (formData.loading) {
		return (
			<div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
				<p className="text-sm text-gray-500">Loading your organizations…</p>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col items-center bg-white px-6 py-12">
			<div className="flex w-full max-w-lg flex-col gap-8">
				<div className="flex items-center justify-between gap-4">
					<div className="flex flex-col gap-1">
						<h1 className="text-2xl font-semibold text-gray-900">Your organizations</h1>
						<p className="text-sm text-gray-500">
							Signed in as {userInfo?.email}. Select an organization to work in, or create a new one.
						</p>
					</div>
					{currentOrgId && (
						<Link href="/contracts">
							<Button icon={<FiFileText />}>View contracts</Button>
						</Link>
					)}
				</div>

				<div className="flex flex-col gap-3">
					{organizations.length === 0 && (
						<p className="text-sm text-gray-500">You don&apos;t belong to any organizations yet.</p>
					)}
					{organizations.map((org) => (
						<button
							key={org.id}
							onClick={() => handleSelect(org.id)}
							className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
								currentOrgId === org.id
									? "border-blue-600 bg-blue-50"
									: "border-gray-200 hover:border-gray-300"
							}`}
						>
							<div className="flex flex-col">
								<span className="font-medium text-gray-900">{org.name}</span>
								<span className="text-xs text-gray-500">{org.slug}</span>
							</div>
							{currentOrgId === org.id && <FiCheck className="text-blue-600" />}
						</button>
					))}
				</div>

				<form onSubmit={handleCreate} className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row">
					<Input
						size="large"
						placeholder="New organization name"
						value={formData.name}
						onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
					/>
					<Button type="primary" size="large" htmlType="submit" icon={<FiPlus />} loading={formData.creating}>
						Create
					</Button>
				</form>
			</div>
		</div>
	);
}
