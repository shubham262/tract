"use client";

import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input, Button, message } from "antd";
import { FiPlus, FiCheck, FiFileText } from "react-icons/fi";
import Link from "next/link";
import { getOrganizations, createOrganization } from "@/service/organizations";
import { setOrganizations, setCurrentOrgId } from "@/redux/orgSlice";
import { ensureSeeded } from "@/service/auth";

const CURRENT_ORG_STORAGE_KEY = "tract:currentOrgId";

const OrganizationsPage = () => {
	const dispatch = useDispatch();
	const userInfo = useSelector((state) => state.auth.userInfo);
	const { organizations, currentOrgId } = useSelector((state) => state.org);

	const [formData, setFormData] = useState({
		name: "",
		creating: false,
		loading: true,
	});

	const loadOrganizations = useCallback(async () => {
		try {
			await ensureSeeded();
			const { organizations: orgs } = await getOrganizations();
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
		loadOrganizations();
	}, [loadOrganizations]);

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
			await createOrganization(formData.name.trim());

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
		return <p className="text-sm text-gray-500">Loading your organizations…</p>;
	}

	return (
		<div className="flex w-full max-w-lg flex-col gap-8">
			<div className="flex items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold text-gray-900">
						Your organizations
					</h1>
					<p className="text-sm text-gray-500">
						Signed in as {userInfo?.email}. Select an organization to work in,
						or create a new one.
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
					<p className="text-sm text-gray-500">
						You don&apos;t belong to any organizations yet.
					</p>
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

			<form
				onSubmit={handleCreate}
				className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row"
			>
				<Input
					size="large"
					placeholder="New organization name"
					value={formData.name}
					onChange={(e) =>
						setFormData((prev) => ({ ...prev, name: e.target.value }))
					}
				/>
				<Button
					type="primary"
					size="large"
					htmlType="submit"
					icon={<FiPlus />}
					loading={formData.creating}
				>
					Create
				</Button>
			</form>
		</div>
	);
};
export default OrganizationsPage;
