import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { VacationStatus } from '@vacation/shared';
import type { User } from './User.js';

@Entity({ name: 'vacation_requests' })
@Check('"end_date" >= "start_date"')
@Index('idx_vac_user_status', ['userId', 'status'])
@Index('idx_vac_status_created', ['status', 'createdAt'])
export class VacationRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne('User', 'requests', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'] as const,
    enumName: 'vacation_status',
    default: 'Pending',
  })
  status!: VacationStatus;

  @Column({ type: 'text', nullable: true })
  comments!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
