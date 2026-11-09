"""Persist normalized facilities without erasing richer source metadata."""
from dataclasses import asdict
from datetime import datetime

from models import Facility
from sources.base_source import FacilityData


def upsert_facility(db_session, data: FacilityData) -> Facility:
    if not data.facility_id or not data.name or not data.city:
        raise ValueError("Facility ID, name, and city are required")

    facility = db_session.query(Facility).filter_by(facility_id=data.facility_id).first()
    values = asdict(data)
    if facility is None:
        facility = Facility(**values)
        db_session.add(facility)
    else:
        if facility.city != data.city:
            raise ValueError(f"Facility ID collision across cities: {data.facility_id}")
        for field, value in values.items():
            if value is not None and value != "":
                setattr(facility, field, value)
        facility.updated_at = datetime.utcnow()
    return facility
