export const fetch_webio = async (data: Record<string, string | number>) => {
  const params = data as Record<string, string>;
  const urlEncodedData = new URLSearchParams(params).toString();
  const url = "http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd";

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": "Mozilla/5.0",
      Referer: "http://data.krx.co.kr/",
    },
    body: urlEncodedData,
  });

  const json = await resp.json();
  return json;
};
