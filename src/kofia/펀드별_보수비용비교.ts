const payload = `
<?xml version="1.0" encoding="utf-8"?>
<message>
  <proframeHeader>
    <pfmAppName>FS-DIS2</pfmAppName>
    <pfmSvcName>DISFundFeeCmsSO</pfmSvcName>
    <pfmFnName>select</pfmFnName>
  </proframeHeader>
  <systemHeader></systemHeader>
    <DISCondFuncDTO>
    <tmpV30>20250131</tmpV30>
    <tmpV11></tmpV11>
    <tmpV12>상장지수</tmpV12>
    <tmpV3></tmpV3>
    <tmpV5></tmpV5>
    <tmpV4></tmpV4>
</DISCondFuncDTO>
</message>
`;

const url = "https://dis.kofia.or.kr/proframeWeb/XMLSERVICES/";
