import { BaseClient } from './server';

export class InternshipClient extends BaseClient {
  constructor(token) { super(undefined, token); }
  fetchAll() { return this.get('internship'); }
  create(data) { return this.post('internship/create', data); }
  update(id, data) { return this.patch(`internship/${id}`, data); }
  deleteOne(id) { return this.delete(`internship/${id}`); }
}
