import { BaseClient } from './server';

export class MajorClient extends BaseClient {
  constructor(token) { super(undefined, token); }
  fetchAll() { return this.get('major'); }
  fetchOne(id) { return this.get(`major/${id}`); }
  create(data) { return this.post('major', data); }
  update(id, data) { return this.patch(`major/${id}`, data); }
  deleteOne(id) { return this.delete(`major/${id}`); }
}
