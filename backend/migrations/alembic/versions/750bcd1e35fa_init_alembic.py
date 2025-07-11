"""init_alembic

Revision ID: 750bcd1e35fa
Revises: 
Create Date: 2025-02-03 14:25:57.311942

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '750bcd1e35fa'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('documents',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('uuid', sa.String(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('department', sa.String(), nullable=False),
    sa.Column('division', sa.String(), nullable=False),
    sa.Column('location', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('uuid')
    )
    op.create_table('document_chunks',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('uuid', sa.String(), nullable=False),
    sa.Column('document_id', sa.Integer(), nullable=False),
    sa.Column('content', sa.String(), nullable=False),
    sa.Column('document_page', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('uuid')
    )
    op.create_table('chunk_embeddings',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('uuid', sa.String(), nullable=False),
    sa.Column('chunk_id', sa.Integer(), nullable=False),
    sa.Column('embedding', postgresql.ARRAY(sa.Float()), nullable=False),
    sa.Column('embedding_model', sa.String(), nullable=False),
    sa.Column('embedding_provider', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['chunk_id'], ['document_chunks.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('uuid')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('chunk_embeddings')
    op.drop_table('document_chunks')
    op.drop_table('documents')
    # ### end Alembic commands ###
