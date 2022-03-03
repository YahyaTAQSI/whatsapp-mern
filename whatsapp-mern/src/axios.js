import axios from "axios";

const instence = axios.create({
  baseURL: "http://localhost:9000",
});

export default instence;
