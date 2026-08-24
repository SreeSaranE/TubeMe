using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SearchController : ControllerBase
    {
        private readonly IYtDlpService _ytDlpService;

        public SearchController(IYtDlpService ytDlpService)
        {
            _ytDlpService = ytDlpService;
        }

        [HttpGet]
        public async Task<ActionResult<List<SearchResultItem>>> Search([FromQuery] string q, [FromQuery] int limit = 12)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new List<SearchResultItem>());
            }

            var results = await _ytDlpService.SearchAsync(q, limit);
            return Ok(results);
        }
    }
}
