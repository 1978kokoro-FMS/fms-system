const { useState, useEffect } = React;
const { Search, Database, Settings, Users, BarChart3, AlertTriangle, ExternalLink, Wrench, Calendar, MapPin, Building, Zap, Droplets, Shield } = lucideReact;

const FMSSystem = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading');

  // CSV 데이터 로드
  useEffect(() => {
    loadCSVData();
  }, []);

  const loadCSVData = async () => {
    try {
      setLoadStatus('loading');
      const response = await fetch('./data.csv');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      if (lines.length <= 1) {
        throw new Error('CSV 파일이 비어있습니다');
      }
      
      // 헤더 파싱
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // 데이터 파싱
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index];
            });
            data.push(row);
          }
        }
      }
      
      setCsvData(data);
      setLoadStatus(`success:${data.length}`);
      console.log('CSV 데이터 로드 완료:', data.length, '개 항목');
      
    } catch (error) {
      console.error('CSV 로드 오류:', error);
      setLoadStatus(`error:${error.message}`);
    }
  };

  // 검색 함수
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const term = searchTerm.toLowerCase();
      const results = csvData.filter(row => {
        return (
          (row['설비코드명'] && row['설비코드명'].toLowerCase().includes(term)) ||
          (row['설비명'] && row['설비명'].toLowerCase().includes(term)) ||
          (row['설치위치'] && row['설치위치'].toLowerCase().includes(term)) ||
          (row['사업소 등록 명칭'] && row['사업소 등록 명칭'].toLowerCase().includes(term)) ||
          (row['관리부서'] && row['관리부서'].toLowerCase().includes(term)) ||
          (row['담당자'] && row['담당자'].toLowerCase().includes(term))
        );
      });

      // 검색 결과를 표시용 형태로 변환
      const formattedResults = results.slice(0, 20).map(row => ({
        code: row['설비코드명'] || row['시설물관리코드'] || 'N/A',
        name: row['설비명'] || 'N/A',
        facility: row['사업소 등록 명칭'] || row['시설명'] || 'N/A',
        location: row['설치위치'] || 'N/A',
        team: row['관리부서'] || 'N/A',
        specs: row['규격'] || '미등록',
        installDate: row['설치일자'] || 'N/A',
        durability: row['내구연한'] ? `${row['내구연한']}년` : 'N/A',
        checkCycle: row['점검주기'] || 'N/A',
        manager: row['담당자'] || 'N/A',
        status: row['Status'] || 'N/A',
        notes: row['특이사항'] || ''
      }));

      setSearchResults(formattedResults);
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 설비 아이콘
  const getEquipmentIcon = (code) => {
    const codeUpper = code.toUpperCase();
    if (codeUpper.includes('EL') || codeUpper.includes('전기')) return React.createElement(Zap, { className: "h-4 w-4 text-yellow-600" });
    if (codeUpper.includes('BO') || codeUpper.includes('보일러')) return React.createElement(Settings, { className: "h-4 w-4 text-blue-600" });
    if (codeUpper.includes('SF') || codeUpper.includes('소방')) return React.createElement(Shield, { className: "h-4 w-4 text-red-600" });
    if (codeUpper.includes('WA') || codeUpper.includes('급수')) return React.createElement(Droplets, { className: "h-4 w-4 text-blue-500" });
    return React.createElement(Settings, { className: "h-4 w-4 text-gray-600" });
  };

  // 로드 상태 표시
  const renderLoadStatus = () => {
    if (loadStatus.startsWith('success:')) {
      const count = loadStatus.split(':')[1];
      return React.createElement('div', { className: "bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2" },
        React.createElement('div', { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }),
        React.createElement('span', { className: "text-green-700 text-sm font-medium" }, `CSV 데이터 로드 성공! (총 ${count}개)`)
      );
    } else if (loadStatus.startsWith('error:')) {
      const error = loadStatus.split(':')[1];
      return React.createElement('div', { className: "bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2" },
        React.createElement(AlertTriangle, { className: "h-4 w-4 text-red-500" }),
        React.createElement('span', { className: "text-red-700 text-sm" }, `데이터 로드 실패: ${error}`),
        React.createElement('button', {
          onClick: loadCSVData,
          className: "ml-2 text-red-600 underline text-sm"
        }, '재시도')
      );
    } else {
      return React.createElement('div', { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2" },
        React.createElement('div', { className: "w-2 h-2 bg-yellow-500 rounded-full animate-spin" }),
        React.createElement('span', { className: "text-yellow-700 text-sm" }, 'CSV 데이터 로딩 중...')
      );
    }
  };

  return React.createElement('div', { className: "max-w-6xl mx-auto p-6 bg-white min-h-screen" },
    // 헤더
    React.createElement('div', { className: "mb-8" },
      React.createElement('div', { className: "flex items-center gap-3 mb-4" },
        React.createElement('div', { className: "bg-blue-600 p-2 rounded-lg" },
          React.createElement(Database, { className: "h-6 w-6 text-white" })
        ),
        React.createElement('div', null,
          React.createElement('h1', { className: "text-2xl font-bold text-gray-900" }, '노성 연동 FMS 시설물 관리시스템'),
          React.createElement('p', { className: "text-gray-600" }, '노성 CSV 데이터 연동 • 스마트 설비 검색 • 통합 관리')
        )
      ),
      // 데이터 로드 상태
      renderLoadStatus()
    ),
    
    // 검색 섹션
    React.createElement('div', { className: "space-y-6" },
      React.createElement('div', { className: "bg-gray-50 rounded-lg p-6" },
        React.createElement('h2', { className: "text-lg font-semibold mb-4 flex items-center gap-2" },
          React.createElement(Search, { className: "h-5 w-5" }),
          '노성 설비 검색'
        ),
        React.createElement('div', { className: "flex gap-2" },
          React.createElement('input', {
            type: "text",
            placeholder: "설비코드, 설비명, 위치로 검색 (예: SC01, 수변전실, 지하1층)",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            onKeyPress: handleKeyPress,
            className: "flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            disabled: isLoading || csvData.length === 0
          }),
          React.createElement('button', {
            onClick: handleSearch,
            disabled: isLoading || csvData.length === 0,
            className: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          },
            React.createElement(Search, { className: "h-4 w-4" }),
            isLoading ? '검색중...' : '검색'
          )
        ),
        React.createElement('button', {
          onClick: loadCSVData,
          className: "mt-3 px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 flex items-center gap-2"
        },
          React.createElement(Database, { className: "h-4 w-4" }),
          '데이터 새로고침'
        )
      ),
      
      // 검색 결과
      searchResults.length > 0 && React.createElement('div', null,
        React.createElement('h3', { className: "text-lg font-semibold mb-4 flex items-center gap-2" },
          React.createElement(Database, { className: "h-5 w-5" }),
          `검색 결과 (${searchResults.length}건)`
        ),
        React.createElement('div', { className: "space-y-4" },
          searchResults.map((item, index) =>
            React.createElement('div', { key: index, className: "bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow" },
              React.createElement('div', { className: "flex justify-between items-start" },
                React.createElement('div', { className: "flex-1" },
                  React.createElement('div', { className: "flex items-center gap-3 mb-3" },
                    getEquipmentIcon(item.code),
                    React.createElement('span', { className: "font-mono text-lg font-bold text-blue-600" }, item.code),
                    React.createElement('span', { className: "px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full" }, item.team),
                    item.status !== 'N/A' && React.createElement('span', { 
                      className: `px-2 py-1 text-xs rounded-full ${item.status === '정상' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`
                    }, item.status)
                  ),
                  React.createElement('h4', { className: "font-semibold text-gray-900 text-lg mb-2" }, item.name),
                  React.createElement('div', { className: "grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3" },
                    React.createElement('div', { className: "flex items-center gap-2" },
                      React.createElement(Building, { className: "h-4 w-4" }),
                      React.createElement('span', null, '시설: ', item.facility)
                    ),
                    React.createElement('div', { className: "flex items-center gap-2" },
                      React.createElement(MapPin, { className: "h-4 w-4" }),
                      React.createElement('span', null, '위치: ', item.location)
                    ),
                    React.createElement('div', { className: "flex items-center gap-2" },
                      React.createElement(Calendar, { className: "h-4 w-4" }),
                      React.createElement('span', null, '설치: ', item.installDate)
                    ),
                    React.createElement('div', { className: "flex items-center gap-2" },
                      React.createElement(Wrench, { className: "h-4 w-4" }),
                      React.createElement('span', null, '점검: ', item.checkCycle)
                    )
                  ),
                  React.createElement('div', { className: "text-sm text-gray-600" },
                    React.createElement('div', null, '규격: ', item.specs),
                    React.createElement('div', null, '내구연한: ', item.durability),
                    item.manager !== 'N/A' && React.createElement('div', null, '담당자: ', item.manager),
                    item.notes && React.createElement('div', { className: "mt-2 p-2 bg-yellow-50 rounded text-yellow-800" }, '특이사항: ', item.notes)
                  )
                )
              )
            )
          )
        )
      ),
      
      // 검색 결과가 없을 때
      searchTerm && !isLoading && searchResults.length === 0 && csvData.length > 0 && 
        React.createElement('div', { className: "text-center py-8 text-gray-500" },
          React.createElement('p', null, '검색 결과가 없습니다.'),
          React.createElement('p', { className: "text-sm mt-2" }, '다른 키워드로 검색해보세요.')
        )
    )
  );
};

// React 앱 렌더링
ReactDOM.render(React.createElement(FMSSystem), document.getElementById('root'));
