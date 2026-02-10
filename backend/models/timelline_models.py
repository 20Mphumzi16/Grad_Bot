from sqlalchemy import Column, Text, Boolean, ForeignKey, Integer, BigInteger, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db import Base
import uuid
from sqlalchemy.sql import func

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    week_label = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    display_order = Column(BigInteger, nullable=False)
    start_week = Column(Integer, nullable=False)
    end_week = Column(Integer, nullable=False)
    status = Column(Text, default='active')

    tasks = relationship("Task", back_populates="milestone")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    milestone_id = Column(UUID(as_uuid=True), ForeignKey("milestones.id", ondelete="CASCADE"))
    name = Column(Text, nullable=False)
    display_order = Column(Integer, nullable=False)
    task_type = Column(Text)

    milestone = relationship("Milestone", back_populates="tasks")
    progress = relationship("TaskProgress", back_populates="task")


class TaskProgress(Base):
    __tablename__ = "task_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    graduate_id = Column(UUID(as_uuid=True), nullable=False)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"))
    completed = Column(Boolean, default=False)
    completed_at = Column(TIMESTAMP(timezone=True))

    task = relationship("Task", back_populates="progress")
