const { useState, useEffect } = React;
const { Search, Database, Settings, Users, BarChart3, AlertTriangle, ExternalLink, Wrench, Calendar, MapPin, Building, Zap, Droplets, Shield } = lucideReact;

const FMSSystem = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 검색 함수
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      if (searchTerm.includes('SC01') || searchTerm.includes('sc01')) {
        setSearchResults([
          { code: 'SC01BO04B1011011', name: '보일러설비', facility: '국민체육센터', location: '지하1층', team: '국민체육센터팀', specs: '미등록', installDate: '2011-01-01', durability: '11년', checkCycle: '수시', notionUrl: 'https://www.notion.so/2232af031f85809f82abf67ac415d4a7' },
          { code: 'SC01SF01B1010010', name: '소방펌프', facility: '국민체육센터', location: '지하1층', team: '국민체육센터팀', specs: '45/5.5kw', installDate: '2010-01-01', durability: '10년', checkCycle: '수시', notionUrl: 'https://www.notion.so/2232af031f85800581d2c9defa149709' }
        ]);
      } else if (searchTerm) {
        setSearchResults([
          { code: 'PK17AT011020', name: '주차요금정산기', facility: '내손공영주차장', location: '1층 출입구', team: '교통시설팀', specs: 'POS 시스템', installDate: '2021-07-10', durability: '10년', checkCycle: '주 1회', notionUrl: 'https://www.notion.so/2232af031f858068a0b7dd3c7bca9a06' }
        ]);
      }
    } catch (error) {
      console.error('검색 오류:', error);
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
    if (code.includes('EL')) return React.createElement(Zap, { className: "h-4 w-4 text-yellow-600" });
    if (code.includes('BO')) return React.createElement(Settings, { className: "h-4 w-4 text-blue-600" });
    if (code.includes('SF')) return React.createElement(Shield, { className: "h-4 w-4 text-red-600" });
    return React.createElement(Settings, { className: "h-4 w-4 text-gray-600" });
  };

  return React.createElement('div', { className: "max-w-6xl mx-auto p-6 bg-white min-h-screen" },
    // 헤더
    React.createElement('div', { className: "mb-8" },
      React.createElement('div', { className: "flex items-center gap-3 mb-4" },
        React.createElement('div', { className: "bg-blue-600 p-2 rounded-lg" },
          React.createElement(Database, { className: "h-6 w-6 text-white" })
        ),
        React.createElement('div', null,
          React.createElement('h1', { className: "text-2xl font-bold text-gray-900" }, '🔗 노션 연동 FMS 시설물 관리시스템'),
          React.createElement('p', { className: "text-gray-600" }, '실시간 노션 데이터베이스 연동 • 스마트 설비 검색 • 통합 관리')
        )
      ),
      // 노션 연결 상태
      React.createElement('div', { className: "bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2" },
        React.createElement('div', { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }),
        React.createElement('span', { className: "text-green-700 text-sm font-medium" }, '노션 시설물 데이터베이스 연결됨')
      )
    ),
    
    // 검색 섹션
    React.createElement('div', { className: "space-y-6" },
      React.createElement('div', { className: "bg-gray-50 rounded-lg p-6" },
        React.createElement('h2', { className: "text-lg font-semibold mb-4" }, '🔍 노션 설비 검색'),
        React.createElement('div', { className: "flex gap-2" },
          React.createElement('input', {
            type: "text",
            placeholder: "설비코드, 설비명, 위치로 검색 (예: SC01, 수변전실, 지하1층)",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            onKeyPress: handleKeyPress,
            className: "flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            disabled: isLoading
          }),
          React.createElement('button', {
            onClick: handleSearch,
            disabled: isLoading,
            className: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          },
            isLoading ? '검색중...' : '검색'
          )
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
                    React.createElement('span', { className: "px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full" }, item.team)
                  ),
                  React.createElement('h4', { className: "font-semibold text-gray-900 text-lg mb-2" }, item.name),
                  React.createElement('div', { className: "grid grid-cols-2 gap-4 text-sm text-gray-600" },
                    React.createElement('div', { className: "flex items-center gap-2" },
                      React.createElement(Building, { className: "h-4 w-4" }),
                      React.createElement('span', null, '시설: ', item.facility)
                    ),
                    React.createElement('div', { className: "flex items-center gap-2" },
                      React.createElement(MapPin, { className: "h-4 w-4" }),
                      React.createElement('span', null, '위치: ', item.location)
                    )
                  )
                ),
                React.createElement('div', { className: "flex flex-col gap-2 ml-4" },
                  React.createElement('button', {
                    onClick: () => window.open(item.notionUrl, '_blank'),
                    className: "px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 flex items-center gap-2"
                  },
                    React.createElement(ExternalLink, { className: "h-4 w-4" }),
                    '노션 열기'
                  )
                )
              )
            )
          )
        )
      )
    )
  );
};

// React 앱 렌더링
ReactDOM.render(React.createElement(FMSSystem), document.getElementById('root'));
