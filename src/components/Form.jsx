import { useEffect, useState } from "react";

import styles from "./Form.module.css";
import Button from "./Button";
import BackButton from "./BackButton";
import { useUrlPosition } from "../hooks/useUrlPosition";
import Message from "./Message";
import Spinner from "./Spinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useCities } from "../contexts/CitiesContext";
import { useNavigate } from "react-router-dom";

const URL =
  "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0";

export function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .trim()
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

function Form() {
  const { createCity, isLoading } = useCities();

  const [lat, lng] = useUrlPosition();
  const navigate = useNavigate();

  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState(new Date());
  const [isLoadingGeoData, setIsLoadingGeoData] = useState(false);
  const [notes, setNotes] = useState("");
  const [emoji, setEmoji] = useState("");
  const [geoDataError, setGeoDataError] = useState("");

  useEffect(() => {
    if (!lat && !lng) return;
    const fetchGeoData = async () => {
      setIsLoadingGeoData(true);
      setGeoDataError("");
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`
        );
        const data = await res.json();
        if (!data.countryCode)
          throw new Error(
            "That doesn't seem to be a city. Click somewhere else 🙂"
          );
        setCityName(data.city || data.locality || "");
        setCountry(data.countryName);
        setEmoji(convertToEmoji(data.countryCode));
      } catch (error) {
        setGeoDataError(error.messsage);
      } finally {
        setIsLoadingGeoData(false);
      }
    };
    fetchGeoData();
  }, [lat, lng]);

  if (geoDataError) return <Message messsage={geoDataError} />;
  if (isLoadingGeoData) return <Spinner />;
  if (!lat && !lng) return <Message message="Start by clicking on the map" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cityName || !date) return;
    const newCity = {
      cityName,
      country,
      emoji,
      date,
      notes,
      position: { lat, lng },
    };
    await createCity(newCity);
    setCityName("");
    setNotes("");
    navigate("/app");
  };

  return (
    <form
      className={`${styles.form} ${isLoading ? styles.loading : ""}`}
      onSubmit={handleSubmit}
    >
      <div className={styles.row}>
        <label htmlFor="cityName">City name</label>
        <input
          id="cityName"
          onChange={(e) => setCityName(e.target.value)}
          value={cityName}
        />
        <span className={styles.flag}>{emoji}</span>
      </div>

      <div className={styles.row}>
        <label htmlFor="date">When did you go to {cityName}?</label>
        <DatePicker
          id="date"
          selected={date}
          onChange={(date) => setDate(date)}
          dateFormat="dd/mm/yyyy"
        />
      </div>

      <div className={styles.row}>
        <label htmlFor="notes">Notes about your trip to {cityName}</label>
        <textarea
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
        />
      </div>

      <div className={styles.buttons}>
        <Button onClick={() => {}} type="primary">
          Add
        </Button>
        <BackButton />
      </div>
    </form>
  );
}

export default Form;
