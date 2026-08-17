import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrDetailComponent } from './cr-detail.component';
import { SessionService } from '../../session/session.service';
import { users } from '../../api/fixtures';
import { ReqUser } from '../../models/cr.models';
import { CrApiService } from '../../api/cr-api.service';
const flush = () => new Promise((r) => setTimeout(r, 0));

async function render(user: ReqUser, id: string): Promise<ComponentFixture<CrDetailComponent>> {
	TestBed.configureTestingModule({
		imports: [CrDetailComponent],
		providers: [{ provide: SessionService, useValue: { user } }],
	});
	await TestBed.compileComponents();
	const fixture = TestBed.createComponent(CrDetailComponent);
	fixture.componentInstance.id = id;
	fixture.detectChanges(); // ngOnInit -> load()
	await flush(); // let the mock API resolve
	fixture.detectChanges(); // render the loaded state
	return fixture;
}

describe('CrDetailComponent', () => {
	it('loads and renders the change request title', async () => {
		const fixture = await render(users.approver, 'CR-1');
		expect(fixture.nativeElement.querySelector('.cr-detail__header h2').textContent).toContain('Add 1 unit of SKU-A');
	});

	it('disables Approve for a read-only viewer on a pending CR', async () => {
		const fixture = await render(users.viewer, 'CR-1'); // viewer: cr_r_o only; CR-1 is PENDING_APPROVAL
		const approveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__approve');
		expect(approveBtn.disabled).toBe(true);
	});

	// my added tests
	it('reject button not rendered for a read-only viewer on a pending CR', async () => {
		const fixture = await render(users.viewer, 'CR-1'); // viewer: cr_r_o only; CR-1 is PENDING_APPROVAL
		const rejectBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__reject-btn');
		expect(rejectBtn).toBeNull();
	});

	it('disables Reject button for a approver if the textarea is empty on a pending CR', async () => {
		const fixture = await render(users.approver, 'CR-1'); // approver; CR-1 is PENDING_APPROVAL
		const rejectBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__reject-btn');
		expect(rejectBtn.disabled).toBe(true);
	});

	it('does not allow read-only users to approve or reject a pending CR', async () => {
		const fixture = await render(users.viewer, 'CR-1'); // viewer: cr_r_o only; CR-1 is PENDING_APPROVAL
		const canApprove = fixture.componentInstance.canApprove;
		const canReject = fixture.componentInstance.canReject;
		expect(canApprove).toBe(false);
		expect(canReject).toBe(false);
	});

	it('does allow approver users to approve or reject a pending CR', async () => {
		const fixture = await render(users.approver, 'CR-1'); // approver; CR-1 is PENDING_APPROVAL
		const canApprove = fixture.componentInstance.canApprove;
		const canReject = fixture.componentInstance.canReject;
		expect(canApprove).toBe(true);
		expect(canReject).toBe(true);
	});

	it('orders timeline entries chronologically', async () => {
		const fixture = await render(users.approver, 'CR-1'); // approver; CR-1 is PENDING_APPROVAL
		fixture.componentInstance.detail.audit = [
			{
				action: 'SEND_FOR_APPROVAL',
				byUserId: 'alice',
				at: '2026-03-02T10:00:00.000Z',
			},
			{
				action: 'SUBMIT',
				byUserId: 'alice',
				at: '2026-03-02T09:30:00.000Z',
			},
			{
				action: 'CREATE',
				byUserId: 'alice',
				at: '2026-03-03T11:00:00.000Z',
			},
		];

		const sortedTimeline = fixture.componentInstance.timeline;

		expect(sortedTimeline[0].at).toBe('2026-03-02T09:30:00.000Z');
		expect(sortedTimeline[1].at).toBe('2026-03-02T10:00:00.000Z');
		expect(sortedTimeline[2].at).toBe('2026-03-03T11:00:00.000Z');
	});

	it('handles unhappy approve path correctly', async () => {
		const fixture = await render(users.approver, 'CR-1'); // approver; CR-1 is PENDING_APPROVAL
		const api = TestBed.inject(CrApiService);
		api.failNext = true;

		await fixture.componentInstance.approve();

		expect(fixture.componentInstance.actionError).toBe('Network error');
		expect(fixture.componentInstance.submitting).toBe(false);
	});

	it('handles unhappy reject path correctly', async () => {
		const fixture = await render(users.approver, 'CR-1'); // approver; CR-1 is PENDING_APPROVAL
		const api = TestBed.inject(CrApiService);
		api.failNext = true;
		const genericRejection = 'CR Rejected';

		fixture.componentInstance.rejectControl.setValue(genericRejection);

		await fixture.componentInstance.reject();

		expect(fixture.componentInstance.actionError).toBe('Network error');
		expect(fixture.componentInstance.submitting).toBe(false);
		expect(fixture.componentInstance.rejectControl.value).toBe(genericRejection);
	});
});
