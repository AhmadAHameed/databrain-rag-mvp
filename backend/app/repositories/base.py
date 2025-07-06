
class BaseRepository:
    def __init__(self, db_connection):
        self.db_connection = db_connection

    def get_all(self):
        raise NotImplementedError("Subclasses should implement this method")

    def get_by_id(self, id):
        raise NotImplementedError("Subclasses should implement this method")