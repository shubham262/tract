const subscribers = new Map(); // organizationId -> Set<res>

const subscribe = (organizationId, res) => {
	if (!subscribers.has(organizationId)) {
		subscribers.set(organizationId, new Set());
	}
	subscribers.get(organizationId).add(res);
};

const unsubscribe = (organizationId, res) => {
	const set = subscribers.get(organizationId);
	if (!set) return;
	set.delete(res);
	if (set.size === 0) subscribers.delete(organizationId);
};

const broadcast = (organizationId, event) => {
	const set = subscribers.get(organizationId);
	if (!set || set.size === 0) return;
	const payload = `data: ${JSON.stringify(event)}\n\n`;
	for (const res of set) res.write(payload);
};

export default { subscribe, unsubscribe, broadcast };
