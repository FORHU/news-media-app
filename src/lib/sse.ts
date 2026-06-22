type SSEClient = {
  send: (event: string, data: unknown) => void;
};

const clients = new Set<SSEClient>();

export const sseBroadcaster = {
  addClient(client: SSEClient) {
    clients.add(client);
    return () => clients.delete(client);
  },
  broadcast(event: string, data: unknown = {}) {
    clients.forEach((c) => c.send(event, data));
  },
};
