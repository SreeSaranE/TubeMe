using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services;

namespace YoutubeDownloader.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly YtDlpService _ytDlpService;

        public SearchController(YtDlpService ytDlpService)
        {
            _ytDlpService = ytDlpService;
        }

        [HttpGet]
        public async Task<ActionResult<List<SearchResultItem>>> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q)) return Ok(new List<SearchResultItem>());
            var results = await _ytDlpService.SearchAsync(q);
            return Ok(results);
        }
    }
}
