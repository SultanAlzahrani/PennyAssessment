import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrApiService } from '../../api/cr-api.service';
import { SessionService } from '../../session/session.service';
import { CrDetail, TimelineEntry } from '../../models/cr.models';
import { idle, loading, ViewState } from '../../common/view-state';
import { computeDiff, DiffRow } from '../diff.util';
import { formatMoney } from '../../common/money.util';

// MINE - IMPORTED
import { canApprovePolicy } from '../../common/permissions';
/**
 * Change Request DETAIL page: loads a CR and renders the diff/preview, the approval timeline, and
 * permission-aware Approve/Reject actions. `load`, the diff binding, and the template skeleton are
 * provided; the timeline ordering, permission gating, actions, and reject validation are yours.
 */
@Component({
	selector: 'app-cr-detail',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './cr-detail.component.html',
})
export class CrDetailComponent implements OnInit {
	@Input() id!: string;

	state: ViewState<CrDetail> = idle();
	submitting = false;
	actionError?: string;
	// TODO: add validation so the form is invalid until a reason is entered.
	rejectControl = new FormControl('', {
		nonNullable: true,
		validators: [Validators.required],
	});

	constructor(private readonly api: CrApiService, private readonly session: SessionService) {}

	ngOnInit(): void {
		void this.load();
	}

	async load(): Promise<void> {
		this.state = loading();

		this.actionError = undefined;
		try {
			const detail = await this.api.getChangeRequest(this.session.user, this.id);
			this.state = { status: 'loaded', data: detail };
		} catch (err) {
			this.state = { status: 'error', data: null, error: (err as Error).message };
		}
	}

	get detail(): CrDetail | null {
		return this.state.data;
	}

	get diff(): DiffRow[] {
		return this.detail ? computeDiff(this.detail.baselineLineItems, this.detail.proposedLineItems) : [];
	}

	/** Approval timeline, oldest-first. */
	get timeline(): TimelineEntry[] {
		const audit = this.detail?.audit ?? [];
		const sortedAudit = [...audit].sort((a, b) => {
			return a.at < b.at ? -1 : a.at > b.at ? 1 : 0;
		});

		return sortedAudit;
	}

	/** Whether the current user may approve the loaded CR. */
	get canApprove(): boolean {
		// NOTE: this only looks at the CR status. The UI must also respect the user's permissions.
		return this.detail?.status === 'PENDING_APPROVAL' && canApprovePolicy(this.session.user);
	}

	get canReject(): boolean {
		return this.detail?.status === 'PENDING_APPROVAL' && canApprovePolicy(this.session.user);
	}

	fmt(amount: number): string {
		return this.detail ? formatMoney(amount, this.detail.currency) : String(amount);
	}

	async approve(): Promise<void> {
		if (this.submitting) {
			return;
		}

		// Now everything is validated, submit the approval
		this.submitting = true;
		this.actionError = '';

		try {
			const isoString = new Date().toISOString();
			const result = await this.api.approve(this.session.user, this.id, isoString);
			this.state = { status: 'loaded', data: result };
		} catch (approvalError) {
			this.actionError = approvalError instanceof Error ? approvalError.message : 'Error Happend during approval';
		} finally {
			this.submitting = false;
		}
	}

	async reject(): Promise<void> {
		if (this.submitting) {
			return;
		}

		if (this.rejectControl.invalid || this.rejectControl.value.trim() === '') {
			this.actionError = 'Please provide a reason for rejection';
			this.rejectControl.setValue('');
			return;
		}

		// Now everything is validated, submit the rejection
		this.submitting = true;
		this.actionError = '';

		try {
			const isoString = new Date().toISOString();
			const reason = this.rejectControl.value.trim();
			const result = await this.api.reject(this.session.user, this.id, reason, isoString);
			console.log(result);
			this.state = { status: 'loaded', data: result };
		} catch (rejectionError) {
			this.actionError = rejectionError instanceof Error ? rejectionError.message : 'Error Happend during Rejection';
		} finally {
			this.submitting = false;
		}
	}
}
